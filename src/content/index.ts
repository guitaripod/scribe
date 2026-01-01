console.log("[Scribe] Module loading...");

import type { Suggestion, RewriteStyle } from "../types";
import type { InputHandler } from "./handlers";
import { InputDetector } from "./detector";
import { Analyzer } from "./analyzer";
import { getOverlayContainer } from "./overlay/container";
import { UnderlineRenderer } from "./overlay/underlines";
import { Tooltip } from "./overlay/tooltip";
import { SelectionPanel } from "./overlay/panel";

interface ActiveInput {
  handler: InputHandler;
  renderer: UnderlineRenderer;
  suggestions: Suggestion[];
  unsubscribe: () => void;
}

class Scribe {
  private detector: InputDetector | null = null;
  private analyzer: Analyzer;
  private tooltip: Tooltip;
  private panel: SelectionPanel;
  private activeInputs = new Map<HTMLElement, ActiveInput>();
  private enabled = true;

  constructor() {
    this.analyzer = new Analyzer(300);
    this.tooltip = new Tooltip();
    this.panel = new SelectionPanel(this.handleRewrite.bind(this));

    this.init();
  }

  private async init(): Promise<void> {
    console.log("[Scribe] Initializing...");
    const response = await chrome.runtime.sendMessage({ type: "GET_SETTINGS" });
    if (response.type === "SETTINGS") {
      this.enabled = response.settings.enabled;
      if (response.settings.debounceMs) {
        this.analyzer = new Analyzer(response.settings.debounceMs);
      }
    }

    if (!this.enabled) {
      console.log("[Scribe] Disabled, not starting");
      return;
    }

    getOverlayContainer();

    this.detector = new InputDetector(
      this.onInputDetected.bind(this),
      this.onInputRemoved.bind(this),
    );
    this.detector.start();
    console.log("[Scribe] Started successfully");

    document.addEventListener(
      "selectionchange",
      this.onSelectionChange.bind(this),
    );
    window.addEventListener("scroll", this.onScroll.bind(this), true);
    window.addEventListener("resize", this.onResize.bind(this));
  }

  private onInputDetected(handler: InputHandler): void {
    const renderer = new UnderlineRenderer(
      handler,
      (suggestion, rect) => this.tooltip.show(suggestion, rect),
      () => this.tooltip.scheduleHide(),
      (suggestion) => this.applySuggestion(handler.element, suggestion),
    );

    const unsubscribe = handler.onTextChange((text) => {
      if (!this.enabled) return;
      console.log(
        "[Scribe] Text changed:",
        text.slice(0, 50) + (text.length > 50 ? "..." : ""),
      );

      this.analyzer.analyze(text, (suggestions) => {
        console.log("[Scribe] Got suggestions:", suggestions.length);
        const active = this.activeInputs.get(handler.element);
        if (active) {
          active.suggestions = suggestions;
          renderer.render(suggestions);
        }
      });
    });

    this.activeInputs.set(handler.element, {
      handler,
      renderer,
      suggestions: [],
      unsubscribe,
    });

    const initialText = handler.getText();
    if (initialText.trim()) {
      this.analyzer.analyze(initialText, (suggestions) => {
        const active = this.activeInputs.get(handler.element);
        if (active) {
          active.suggestions = suggestions;
          renderer.render(suggestions);
        }
      });
    }
  }

  private onInputRemoved(element: HTMLElement): void {
    const active = this.activeInputs.get(element);
    if (active) {
      active.unsubscribe();
      active.renderer.destroy();
      this.activeInputs.delete(element);
    }
  }

  private applySuggestion(element: HTMLElement, suggestion: Suggestion): void {
    const active = this.activeInputs.get(element);
    if (!active) return;

    active.handler.replaceText(
      suggestion.start,
      suggestion.end,
      suggestion.replacement,
    );
    active.renderer.removeSuggestion(suggestion.id);
    this.tooltip.hide();

    const offset = suggestion.replacement.length - suggestion.original.length;
    active.suggestions = active.suggestions
      .filter((s) => s.id !== suggestion.id)
      .map((s) => {
        if (s.start > suggestion.end) {
          return { ...s, start: s.start + offset, end: s.end + offset };
        }
        return s;
      });
  }

  private onSelectionChange(): void {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      this.panel.hide();
      return;
    }

    const text = selection.toString().trim();
    console.log(
      "[Scribe] Selection changed, text length:",
      text.length,
      "text:",
      text.slice(0, 20),
    );
    if (text.length < 2) {
      this.panel.hide();
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    console.log(
      "[Scribe] Selection rect:",
      rect.width,
      rect.height,
      rect.top,
      rect.left,
    );

    if (rect.width > 0 && rect.height > 0) {
      console.log("[Scribe] Showing panel");
      this.panel.show(rect);
    }
  }

  private async handleRewrite(style: RewriteStyle): Promise<void> {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const selectedText = selection.toString();
    if (!selectedText.trim()) return;

    const range = selection.getRangeAt(0).cloneRange();
    const container = range.commonAncestorContainer;
    const editableParent = (
      container instanceof Element
        ? container.closest('[contenteditable="true"]')
        : container.parentElement?.closest('[contenteditable="true"]')
    ) as HTMLElement | null;

    let textToRewrite = selectedText;
    let fullContext = "";

    if (editableParent) {
      fullContext = editableParent.innerText || "";
      if (fullContext !== selectedText && fullContext.includes(selectedText)) {
        textToRewrite = `Context: "${fullContext}"\n\nRewrite only this selected part: "${selectedText}"`;
      }
    }

    console.log("[Scribe] Rewriting:", selectedText.slice(0, 30), "...");
    const result = await this.analyzer.rewrite(textToRewrite, style);
    console.log("[Scribe] Got result:", result?.slice(0, 30), "...");
    if (!result) return;

    const cleanResult = result.replace(/^["']|["']$/g, "").trim();

    range.deleteContents();
    const textNode = document.createTextNode(cleanResult);
    range.insertNode(textNode);

    const newRange = document.createRange();
    newRange.setStartAfter(textNode);
    newRange.collapse(true);

    selection.removeAllRanges();
    selection.addRange(newRange);

    if (editableParent) {
      editableParent.dispatchEvent(new Event("input", { bubbles: true }));
      editableParent.focus();
    }

    console.log("[Scribe] Text replaced");
  }

  private onScroll(): void {
    for (const active of this.activeInputs.values()) {
      active.renderer.updatePositions();
    }
  }

  private onResize(): void {
    for (const active of this.activeInputs.values()) {
      active.renderer.updatePositions();
    }
  }

  destroy(): void {
    this.detector?.stop();
    this.tooltip.destroy();
    this.panel.destroy();
    this.analyzer.cancel();

    for (const active of this.activeInputs.values()) {
      active.unsubscribe();
      active.renderer.destroy();
    }
    this.activeInputs.clear();
  }
}

function init() {
  console.log("[Scribe] Content script loaded");
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => new Scribe());
  } else {
    new Scribe();
  }
}

init();

export function onExecute() {
  console.log("[Scribe] onExecute called");
}
