import type { InputHandler } from "./types";

export class TextareaHandler implements InputHandler {
  element: HTMLTextAreaElement | HTMLInputElement;
  private listeners: (() => void)[] = [];
  private mirror: HTMLDivElement | null = null;

  constructor(element: HTMLTextAreaElement | HTMLInputElement) {
    this.element = element;
  }

  getText(): string {
    return this.element.value;
  }

  replaceText(start: number, end: number, replacement: string): void {
    const text = this.element.value;
    this.element.value = text.slice(0, start) + replacement + text.slice(end);
    this.element.selectionStart = this.element.selectionEnd =
      start + replacement.length;
    this.element.dispatchEvent(new Event("input", { bubbles: true }));
  }

  getCharacterRects(start: number, end: number): DOMRect[] {
    const mirror = this.getMirror();
    const text = this.element.value;

    mirror.textContent = "";

    const before = document.createTextNode(text.slice(0, start));
    const highlight = document.createElement("span");
    highlight.textContent = text.slice(start, end);
    const after = document.createTextNode(text.slice(end));

    mirror.appendChild(before);
    mirror.appendChild(highlight);
    mirror.appendChild(after);

    const rect = highlight.getBoundingClientRect();
    return [rect];
  }

  private getMirror(): HTMLDivElement {
    if (this.mirror) {
      this.updateMirrorPosition();
      return this.mirror;
    }

    this.mirror = document.createElement("div");
    const style = window.getComputedStyle(this.element);

    const props = [
      "fontFamily",
      "fontSize",
      "fontWeight",
      "fontStyle",
      "letterSpacing",
      "wordSpacing",
      "lineHeight",
      "textTransform",
      "paddingLeft",
      "paddingRight",
      "paddingTop",
      "paddingBottom",
      "borderLeftWidth",
      "borderRightWidth",
      "borderTopWidth",
      "borderBottomWidth",
      "boxSizing",
      "whiteSpace",
      "wordWrap",
      "overflowWrap",
    ] as const;

    props.forEach((prop) => {
      (this.mirror!.style as unknown as Record<string, string>)[prop] =
        style[prop];
    });

    this.mirror.style.position = "absolute";
    this.mirror.style.visibility = "hidden";
    this.mirror.style.pointerEvents = "none";
    this.mirror.style.whiteSpace = "pre-wrap";
    this.mirror.style.wordWrap = "break-word";

    document.body.appendChild(this.mirror);
    this.updateMirrorPosition();

    return this.mirror;
  }

  private updateMirrorPosition(): void {
    if (!this.mirror) return;

    const rect = this.element.getBoundingClientRect();
    const style = window.getComputedStyle(this.element);

    this.mirror.style.left = `${rect.left + window.scrollX}px`;
    this.mirror.style.top = `${rect.top + window.scrollY}px`;
    this.mirror.style.width = `${this.element.clientWidth}px`;

    if (this.element.tagName === "TEXTAREA") {
      this.mirror.style.height = `${this.element.clientHeight}px`;
      this.mirror.style.overflow = "hidden";
      this.mirror.scrollTop = (this.element as HTMLTextAreaElement).scrollTop;
    }
  }

  onTextChange(callback: (text: string) => void): () => void {
    const handler = () => callback(this.getText());
    this.element.addEventListener("input", handler);
    this.listeners.push(() =>
      this.element.removeEventListener("input", handler),
    );
    return () => this.element.removeEventListener("input", handler);
  }

  destroy(): void {
    this.listeners.forEach((unsub) => unsub());
    this.listeners = [];
    if (this.mirror) {
      this.mirror.remove();
      this.mirror = null;
    }
  }
}

export function createTextareaHandler(
  element: HTMLElement,
): TextareaHandler | null {
  if (element instanceof HTMLTextAreaElement) {
    return new TextareaHandler(element);
  }
  if (element instanceof HTMLInputElement) {
    const type = element.type.toLowerCase();
    if (["text", "email", "search", "url"].includes(type)) {
      return new TextareaHandler(element);
    }
  }
  return null;
}
