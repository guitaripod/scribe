export interface InputHandler {
  element: HTMLElement;
  getText(): string;
  replaceText(start: number, end: number, replacement: string): void;
  getCharacterRects(start: number, end: number): DOMRect[];
  onTextChange(callback: (text: string) => void): () => void;
  destroy(): void;
}

export type InputHandlerFactory = (element: HTMLElement) => InputHandler | null;
