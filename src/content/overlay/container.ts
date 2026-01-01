const CONTAINER_ID = "scribe-overlay-container";

const STYLES = `
  :host {
    all: initial;
    position: fixed;
    top: 0;
    left: 0;
    width: 0;
    height: 0;
    z-index: 2147483647;
    pointer-events: none;
  }

  * {
    box-sizing: border-box;
  }

  .scribe-underline {
    position: fixed;
    pointer-events: auto;
    cursor: pointer;
    height: 2px;
    background-repeat: repeat-x;
    background-size: 4px 2px;
  }

  .scribe-underline[data-type="grammar"] {
    background-image: linear-gradient(90deg, #e53935 50%, transparent 50%);
  }

  .scribe-underline[data-type="spelling"] {
    background-image: linear-gradient(90deg, #1e88e5 50%, transparent 50%);
  }

  .scribe-underline[data-type="style"] {
    background-image: linear-gradient(90deg, #fdd835 50%, transparent 50%);
  }

  .scribe-tooltip {
    position: fixed;
    background: #1a1a1a;
    color: #fff;
    padding: 6px 10px;
    border-radius: 4px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 13px;
    line-height: 1.4;
    max-width: 300px;
    pointer-events: auto;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    z-index: 2147483647;
  }

  .scribe-tooltip-original {
    text-decoration: line-through;
    color: #999;
    margin-right: 8px;
  }

  .scribe-tooltip-replacement {
    color: #4caf50;
    font-weight: 500;
  }

  .scribe-panel {
    position: fixed;
    background: #1a1a1a;
    border-radius: 6px;
    padding: 4px;
    display: flex;
    gap: 2px;
    pointer-events: auto;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 2147483647;
  }

  .scribe-panel-btn {
    background: transparent;
    border: none;
    color: #ccc;
    padding: 6px 10px;
    border-radius: 4px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 12px;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }

  .scribe-panel-btn:hover {
    background: #333;
    color: #fff;
  }

  .scribe-panel-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .scribe-panel-btn.loading {
    opacity: 0.7;
  }
`;

export class OverlayContainer {
  private container: HTMLDivElement;
  private shadow: ShadowRoot;
  private content: HTMLDivElement;

  constructor() {
    const existing = document.getElementById(CONTAINER_ID);
    if (existing) {
      existing.remove();
    }

    this.container = document.createElement("div");
    this.container.id = CONTAINER_ID;
    this.shadow = this.container.attachShadow({ mode: "closed" });

    const style = document.createElement("style");
    style.textContent = STYLES;
    this.shadow.appendChild(style);

    this.content = document.createElement("div");
    this.shadow.appendChild(this.content);

    document.body.appendChild(this.container);
  }

  getRoot(): HTMLDivElement {
    return this.content;
  }

  getContainer(): HTMLDivElement {
    return this.container;
  }

  destroy(): void {
    this.container.remove();
  }
}

let instance: OverlayContainer | null = null;

export function getOverlayContainer(): OverlayContainer {
  if (!instance || !document.body.contains(instance.getContainer())) {
    instance = new OverlayContainer();
  }
  return instance;
}
