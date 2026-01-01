import { REWRITE_LABELS, type RewriteStyle } from "../../types";
import { getOverlayContainer } from "./container";

export class SelectionPanel {
  private element: HTMLDivElement | null = null;
  private onRewrite: (style: RewriteStyle) => Promise<void>;
  private loading = false;

  constructor(onRewrite: (style: RewriteStyle) => Promise<void>) {
    this.onRewrite = onRewrite;
  }

  show(rect: DOMRect): void {
    this.hide();

    const root = getOverlayContainer().getRoot();

    this.element = document.createElement("div");
    this.element.className = "scribe-panel";

    const styles: RewriteStyle[] = [
      "fix",
      "shorten",
      "formal",
      "casual",
      "expand",
    ];

    for (const style of styles) {
      const btn = document.createElement("button");
      btn.className = "scribe-panel-btn";
      btn.textContent = REWRITE_LABELS[style];
      btn.dataset.style = style;

      btn.addEventListener("mousedown", (e) => {
        e.preventDefault();
      });

      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();

        console.log("[Scribe] Panel button clicked:", style);

        if (this.loading) return;
        this.setLoading(true);

        try {
          await this.onRewrite(style);
        } finally {
          this.setLoading(false);
          this.hide();
        }
      });

      this.element.appendChild(btn);
    }

    root.appendChild(this.element);

    const panelRect = this.element.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - panelRect.width / 2;
    let top = rect.bottom + 8;

    if (left < 8) left = 8;
    if (left + panelRect.width > window.innerWidth - 8) {
      left = window.innerWidth - panelRect.width - 8;
    }

    if (top + panelRect.height > window.innerHeight - 8) {
      top = rect.top - panelRect.height - 8;
    }

    this.element.style.left = `${left}px`;
    this.element.style.top = `${top}px`;
  }

  private setLoading(loading: boolean): void {
    this.loading = loading;
    if (this.element) {
      const buttons =
        this.element.querySelectorAll<HTMLButtonElement>(".scribe-panel-btn");
      buttons.forEach((btn) => {
        btn.disabled = loading;
        btn.classList.toggle("loading", loading);
      });
    }
  }

  hide(): void {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    this.loading = false;
  }

  isVisible(): boolean {
    return this.element !== null;
  }

  destroy(): void {
    this.hide();
  }
}
