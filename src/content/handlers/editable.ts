import type { InputHandler } from "./types";

export class ContentEditableHandler implements InputHandler {
  element: HTMLElement;
  private listeners: (() => void)[] = [];
  private observer: MutationObserver | null = null;

  constructor(element: HTMLElement) {
    this.element = element;
  }

  getText(): string {
    return this.element.innerText || this.element.textContent || "";
  }

  replaceText(start: number, end: number, replacement: string): void {
    const result = this.findTextNodeAtOffset(start);
    const endResult = this.findTextNodeAtOffset(end);

    if (!result || !endResult) return;

    const range = document.createRange();
    range.setStart(result.node, result.offset);
    range.setEnd(endResult.node, endResult.offset);
    range.deleteContents();

    const textNode = document.createTextNode(replacement);
    range.insertNode(textNode);

    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      const newRange = document.createRange();
      newRange.setStartAfter(textNode);
      newRange.collapse(true);
      sel.addRange(newRange);
    }

    this.element.dispatchEvent(new Event("input", { bubbles: true }));
  }

  getCharacterRects(start: number, end: number): DOMRect[] {
    const startResult = this.findTextNodeAtOffset(start);
    const endResult = this.findTextNodeAtOffset(end);

    if (!startResult || !endResult) return [];

    const range = document.createRange();
    range.setStart(startResult.node, startResult.offset);
    range.setEnd(endResult.node, endResult.offset);

    return Array.from(range.getClientRects());
  }

  private findTextNodeAtOffset(
    targetOffset: number,
  ): { node: Text; offset: number } | null {
    const walker = document.createTreeWalker(
      this.element,
      NodeFilter.SHOW_TEXT,
      null,
    );

    let currentOffset = 0;
    let node: Text | null;

    while ((node = walker.nextNode() as Text | null)) {
      const nodeLength = node.textContent?.length || 0;
      if (currentOffset + nodeLength >= targetOffset) {
        return {
          node,
          offset: targetOffset - currentOffset,
        };
      }
      currentOffset += nodeLength;
    }

    return null;
  }

  onTextChange(callback: (text: string) => void): () => void {
    const inputHandler = () => callback(this.getText());
    this.element.addEventListener("input", inputHandler);

    this.observer = new MutationObserver(() => callback(this.getText()));
    this.observer.observe(this.element, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    const cleanup = () => {
      this.element.removeEventListener("input", inputHandler);
      this.observer?.disconnect();
    };

    this.listeners.push(cleanup);
    return cleanup;
  }

  destroy(): void {
    this.listeners.forEach((unsub) => unsub());
    this.listeners = [];
    this.observer?.disconnect();
    this.observer = null;
  }
}

export function createContentEditableHandler(
  element: HTMLElement,
): ContentEditableHandler | null {
  const editable = element.getAttribute("contenteditable");
  const role = element.getAttribute("role");
  const isEditable = editable === "true" || editable === "plaintext-only";
  const isTextbox = role === "textbox";
  const isTwitterEditor =
    element.hasAttribute("data-testid") &&
    element.getAttribute("data-testid")?.includes("tweetTextarea");
  const isDraftEditor =
    element.classList.contains("public-DraftEditor-content") ||
    element.classList.contains("notranslate");

  if (isEditable || isTextbox || isTwitterEditor || isDraftEditor) {
    return new ContentEditableHandler(element);
  }
  return null;
}
