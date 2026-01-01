import type { Suggestion, RewriteStyle } from "../types";
import type { Request, Response } from "../types/messages";

function sendMessage(request: Request): Promise<Response> {
  return chrome.runtime.sendMessage(request);
}

export class Analyzer {
  private debounceMs: number;
  private pendingTimeout: ReturnType<typeof setTimeout> | null = null;
  private pendingId: string | null = null;
  private lastAnalyzedText: string = "";

  constructor(debounceMs: number = 300) {
    this.debounceMs = debounceMs;
  }

  analyze(text: string, callback: (suggestions: Suggestion[]) => void): void {
    if (this.pendingTimeout) {
      clearTimeout(this.pendingTimeout);
    }

    if (text === this.lastAnalyzedText) {
      return;
    }

    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    this.pendingId = id;

    this.pendingTimeout = setTimeout(async () => {
      if (this.pendingId !== id) return;
      if (text === this.lastAnalyzedText) return;

      this.lastAnalyzedText = text;

      try {
        const response = await sendMessage({ type: "ANALYZE", text, id });

        if (this.pendingId !== id) return;

        if (response.type === "SUGGESTIONS") {
          callback(response.suggestions);
        } else if (response.type === "ERROR") {
          console.error("[Scribe] Analysis error:", response.error);
          callback([]);
        }
      } catch (err) {
        console.error("[Scribe] Failed to analyze:", err);
        callback([]);
      }
    }, this.debounceMs);
  }

  async rewrite(text: string, style: RewriteStyle): Promise<string | null> {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    try {
      const response = await sendMessage({ type: "REWRITE", text, style, id });

      if (response.type === "REWRITTEN") {
        return response.text;
      } else if (response.type === "ERROR") {
        console.error("[Scribe] Rewrite error:", response.error);
        return null;
      }
    } catch (err) {
      console.error("[Scribe] Failed to rewrite:", err);
    }

    return null;
  }

  cancel(): void {
    if (this.pendingTimeout) {
      clearTimeout(this.pendingTimeout);
      this.pendingTimeout = null;
    }
    this.pendingId = null;
  }
}
