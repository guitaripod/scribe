import type { InputHandler } from "./types";
import { createTextareaHandler } from "./textarea";
import { createContentEditableHandler } from "./editable";

export type { InputHandler };

export function createHandler(element: HTMLElement): InputHandler | null {
  return (
    createTextareaHandler(element) || createContentEditableHandler(element)
  );
}
