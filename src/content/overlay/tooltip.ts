import type { Suggestion } from "../../types";
import { getOverlayContainer } from "./container";

export class Tooltip {
  private element: HTMLDivElement | null = null;
  private hideTimeout: ReturnType<typeof setTimeout> | null = null;

  show(suggestion: Suggestion, rect: DOMRect): void {
    this.cancelHide();
    this.hide();

    const root = getOverlayContainer().getRoot();

    this.element = document.createElement("div");
    this.element.className = "scribe-tooltip";

    const original = document.createElement("span");
    original.className = "scribe-tooltip-original";
    original.textContent = suggestion.original;

    const arrow = document.createTextNode(" → ");

    const replacement = document.createElement("span");
    replacement.className = "scribe-tooltip-replacement";
    replacement.textContent = suggestion.replacement;

    this.element.appendChild(original);
    this.element.appendChild(arrow);
    this.element.appendChild(replacement);

    root.appendChild(this.element);

    const tooltipRect = this.element.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
    let top = rect.bottom + 8;

    if (left < 8) left = 8;
    if (left + tooltipRect.width > window.innerWidth - 8) {
      left = window.innerWidth - tooltipRect.width - 8;
    }

    if (top + tooltipRect.height > window.innerHeight - 8) {
      top = rect.top - tooltipRect.height - 8;
    }

    this.element.style.left = `${left}px`;
    this.element.style.top = `${top}px`;
  }

  hide(): void {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }

  scheduleHide(delay: number = 100): void {
    this.cancelHide();
    this.hideTimeout = setTimeout(() => this.hide(), delay);
  }

  cancelHide(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  destroy(): void {
    this.cancelHide();
    this.hide();
  }
}
