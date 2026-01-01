export interface Suggestion {
  id: string;
  start: number;
  end: number;
  original: string;
  replacement: string;
  type: "grammar" | "spelling" | "style";
}

export interface Settings {
  enabled: boolean;
  ollamaUrl: string;
  model: string;
  autoAnalyze: boolean;
  debounceMs: number;
}

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  ollamaUrl: "http://localhost:11434",
  model: "gemma3:4b",
  autoAnalyze: true,
  debounceMs: 300,
};

export type RewriteStyle = "fix" | "shorten" | "formal" | "casual" | "expand";

export const REWRITE_LABELS: Record<RewriteStyle, string> = {
  fix: "Fix Grammar",
  shorten: "Shorten",
  formal: "Formal",
  casual: "Casual",
  expand: "Expand",
};
