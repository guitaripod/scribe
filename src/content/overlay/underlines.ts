import type { Suggestion } from "../../types";
import type { InputHandler } from "../handlers";
import { getOverlayContainer } from "./container";

interface UnderlineElement {
  suggestion: Suggestion;
  elements: HTMLDivElement[];
}

export class UnderlineRenderer {
  private handler: InputHandler;
  private underlines: UnderlineElement[] = [];
  private onHover: (suggestion: Suggestion, rect: DOMRect) => void;
  private onLeave: () => void;
  private onClick: (suggestion: Suggestion) => void;

  constructor(
    handler: InputHandler,
    onHover: (suggestion: Suggestion, rect: DOMRect) => void,
    onLeave: () => void,
    onClick: (suggestion: Suggestion) => void,
  ) {
    this.handler = handler;
    this.onHover = onHover;
    this.onLeave = onLeave;
    this.onClick = onClick;
  }

  render(suggestions: Suggestion[]): void {
    this.clear();

    const root = getOverlayContainer().getRoot();

    for (const suggestion of suggestions) {
      const rects = this.handler.getCharacterRects(
        suggestion.start,
        suggestion.end,
      );
      const elements: HTMLDivElement[] = [];

      for (const rect of rects) {
        if (rect.width === 0 || rect.height === 0) continue;

        const el = document.createElement("div");
        el.className = "scribe-underline";
        el.dataset.type = suggestion.type;
        el.dataset.id = suggestion.id;

        el.style.left = `${rect.left}px`;
        el.style.top = `${rect.bottom - 2}px`;
        el.style.width = `${rect.width}px`;

        el.addEventListener("mouseenter", () => {
          this.onHover(suggestion, rect);
        });

        el.addEventListener("mouseleave", () => {
          this.onLeave();
        });

        el.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.onClick(suggestion);
        });

        root.appendChild(el);
        elements.push(el);
      }

      this.underlines.push({ suggestion, elements });
    }
  }

  updatePositions(): void {
    for (const { suggestion, elements } of this.underlines) {
      const rects = this.handler.getCharacterRects(
        suggestion.start,
        suggestion.end,
      );

      elements.forEach((el, i) => {
        const rect = rects[i];
        if (rect) {
          el.style.left = `${rect.left}px`;
          el.style.top = `${rect.bottom - 2}px`;
          el.style.width = `${rect.width}px`;
        }
      });
    }
  }

  removeSuggestion(id: string): void {
    const index = this.underlines.findIndex((u) => u.suggestion.id === id);
    if (index !== -1) {
      const { elements } = this.underlines[index];
      elements.forEach((el) => el.remove());
      this.underlines.splice(index, 1);
    }
  }

  clear(): void {
    for (const { elements } of this.underlines) {
      elements.forEach((el) => el.remove());
    }
    this.underlines = [];
  }

  destroy(): void {
    this.clear();
  }
}
