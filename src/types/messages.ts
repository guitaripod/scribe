import type { Suggestion, Settings, RewriteStyle } from "./index";

export type Request =
  | { type: "ANALYZE"; text: string; id: string }
  | { type: "REWRITE"; text: string; style: RewriteStyle; id: string }
  | { type: "HEALTH" }
  | { type: "GET_SETTINGS" }
  | { type: "SET_SETTINGS"; settings: Partial<Settings> };

export type Response =
  | { type: "SUGGESTIONS"; suggestions: Suggestion[]; id: string }
  | { type: "REWRITTEN"; text: string; id: string }
  | { type: "HEALTH_OK"; models: string[] }
  | { type: "HEALTH_FAIL"; error: string }
  | { type: "SETTINGS"; settings: Settings }
  | { type: "ERROR"; error: string; id?: string };
