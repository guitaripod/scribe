import { createHandler, type InputHandler } from "./handlers";

export class InputDetector {
  private handlers = new Map<HTMLElement, InputHandler>();
  private observer: MutationObserver | null = null;
  private onDetect: (handler: InputHandler) => void;
  private onRemove: (element: HTMLElement) => void;

  constructor(
    onDetect: (handler: InputHandler) => void,
    onRemove: (element: HTMLElement) => void,
  ) {
    this.onDetect = onDetect;
    this.onRemove = onRemove;
  }

  start(): void {
    console.log("[Scribe] InputDetector starting...");
    this.scanDocument();
    this.observeMutations();
  }

  stop(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.handlers.forEach((handler) => handler.destroy());
    this.handlers.clear();
  }

  private scanDocument(): void {
    const selectors = [
      "textarea",
      'input[type="text"]',
      'input[type="email"]',
      'input[type="search"]',
      'input[type="url"]',
      "input:not([type])",
      '[contenteditable="true"]',
      '[contenteditable="plaintext-only"]',
      '[role="textbox"]',
      '[data-testid="tweetTextarea_0"]',
      ".public-DraftEditor-content",
      ".DraftEditor-root [contenteditable]",
      ".notranslate[contenteditable]",
    ];

    console.log("[Scribe] Scanning document for inputs...");
    const elements = document.querySelectorAll<HTMLElement>(
      selectors.join(","),
    );
    console.log("[Scribe] Found", elements.length, "potential inputs");
    elements.forEach((el) => this.tryRegister(el));
  }

  private observeMutations(): void {
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              this.checkElement(node);
            }
          });

          mutation.removedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              this.handleRemoved(node);
            }
          });
        }

        if (
          mutation.type === "attributes" &&
          mutation.target instanceof HTMLElement
        ) {
          if (mutation.attributeName === "contenteditable") {
            this.tryRegister(mutation.target);
          }
        }
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["contenteditable"],
    });
  }

  private checkElement(element: HTMLElement): void {
    this.tryRegister(element);
    element
      .querySelectorAll<HTMLElement>("textarea, input, [contenteditable]")
      .forEach((el) => this.tryRegister(el));
  }

  private tryRegister(element: HTMLElement): void {
    if (this.handlers.has(element)) return;

    const handler = createHandler(element);
    if (handler) {
      console.log(
        "[Scribe] Registered input:",
        element.tagName,
        element.className ||
          element.getAttribute("role") ||
          element.getAttribute("data-testid"),
      );
      this.handlers.set(element, handler);
      this.onDetect(handler);
    }
  }

  private handleRemoved(element: HTMLElement): void {
    const handler = this.handlers.get(element);
    if (handler) {
      handler.destroy();
      this.handlers.delete(element);
      this.onRemove(element);
    }

    element
      .querySelectorAll<HTMLElement>("textarea, input, [contenteditable]")
      .forEach((el) => {
        const h = this.handlers.get(el);
        if (h) {
          h.destroy();
          this.handlers.delete(el);
          this.onRemove(el);
        }
      });
  }
}
