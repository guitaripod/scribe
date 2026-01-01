import type { Request, Response } from "../types/messages";
import type { Settings } from "../types";
import { DEFAULT_SETTINGS } from "../types";
import { OllamaClient } from "./ollama";

let settings: Settings = { ...DEFAULT_SETTINGS };
let client = new OllamaClient(settings);

async function loadSettings(): Promise<void> {
  const stored = await chrome.storage.local.get("settings");
  if (stored.settings) {
    settings = { ...DEFAULT_SETTINGS, ...stored.settings };
    client.updateSettings(settings);
  }
}

async function saveSettings(partial: Partial<Settings>): Promise<void> {
  settings = { ...settings, ...partial };
  await chrome.storage.local.set({ settings });
  client.updateSettings(settings);
}

export async function handleMessage(
  request: Request,
  _sender: chrome.runtime.MessageSender,
): Promise<Response> {
  await loadSettings();

  switch (request.type) {
    case "HEALTH": {
      const result = await client.checkHealth();
      if (result.ok) {
        return { type: "HEALTH_OK", models: result.models };
      }
      return { type: "HEALTH_FAIL", error: result.error || "Unknown error" };
    }

    case "GET_SETTINGS": {
      return { type: "SETTINGS", settings };
    }

    case "SET_SETTINGS": {
      await saveSettings(request.settings);
      return { type: "SETTINGS", settings };
    }

    case "ANALYZE": {
      if (!settings.enabled) {
        return { type: "SUGGESTIONS", suggestions: [], id: request.id };
      }

      try {
        const suggestions = await client.analyze(request.text);
        return { type: "SUGGESTIONS", suggestions, id: request.id };
      } catch (err) {
        return { type: "ERROR", error: String(err), id: request.id };
      }
    }

    case "REWRITE": {
      console.log(
        "[Scribe] Rewrite request:",
        request.style,
        request.text.slice(0, 50),
      );
      try {
        const text = await client.rewrite(request.text, request.style);
        console.log("[Scribe] Rewrite result:", text.slice(0, 50));
        return { type: "REWRITTEN", text, id: request.id };
      } catch (err) {
        console.error("[Scribe] Rewrite failed:", err);
        return { type: "ERROR", error: String(err), id: request.id };
      }
    }

    default:
      return { type: "ERROR", error: "Unknown request type" };
  }
}
