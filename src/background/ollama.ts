import type {
  Suggestion,
  Settings,
  RewriteStyle,
  DEFAULT_SETTINGS,
} from "../types";

const ANALYZE_PROMPT = `Analyze this text for grammar, spelling, and style errors.
Return a JSON array of corrections. Each correction has:
- start: character index where error starts
- end: character index where error ends
- original: the incorrect text
- replacement: the corrected text
- type: "grammar", "spelling", or "style"

If no errors, return an empty array: []
Only return valid JSON, no explanation or markdown.

Text: """
{TEXT}
"""`;

const REWRITE_PROMPTS: Record<RewriteStyle, string> = {
  fix: "Fix all grammar, spelling, and punctuation errors. If context is provided, only return the corrected selected part (not the full context). Return only the corrected text, nothing else - no quotes, no explanation.",
  shorten:
    "Make this text more concise while preserving its meaning. If context is provided, only return the shortened selected part. Return only the shortened text, nothing else - no quotes, no explanation.",
  formal:
    "Rewrite this text in a formal, professional tone. If context is provided, only return the rewritten selected part. Return only the rewritten text, nothing else - no quotes, no explanation.",
  casual:
    "Rewrite this text in a casual, conversational tone. If context is provided, only return the rewritten selected part. Return only the rewritten text, nothing else - no quotes, no explanation.",
  expand:
    "Expand this text with more detail and elaboration. If context is provided, only return the expanded selected part. Return only the expanded text, nothing else - no quotes, no explanation.",
};

export class OllamaClient {
  private baseUrl: string;
  private model: string;

  constructor(settings: Pick<Settings, "ollamaUrl" | "model">) {
    this.baseUrl = settings.ollamaUrl;
    this.model = settings.model;
  }

  updateSettings(settings: Partial<Pick<Settings, "ollamaUrl" | "model">>) {
    if (settings.ollamaUrl) this.baseUrl = settings.ollamaUrl;
    if (settings.model) this.model = settings.model;
  }

  async checkHealth(): Promise<{
    ok: boolean;
    models: string[];
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        return { ok: false, models: [], error: `HTTP ${response.status}` };
      }

      const data = await response.json();
      const models = (data.models || []).map((m: { name: string }) => m.name);
      return { ok: true, models };
    } catch (err) {
      return { ok: false, models: [], error: String(err) };
    }
  }

  async analyze(text: string): Promise<Suggestion[]> {
    const prompt = ANALYZE_PROMPT.replace("{TEXT}", text);

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        prompt,
        stream: false,
        options: {
          temperature: 0.1,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama returned ${response.status}`);
    }

    const data = await response.json();
    const content = data.response || "";

    try {
      let jsonStr = content;
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
      }

      const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.log("[Scribe] No JSON array found in:", content);
        return [];
      }

      const parsed = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(parsed)) {
        return [];
      }

      const suggestions: Suggestion[] = [];
      for (let i = 0; i < parsed.length; i++) {
        const s = parsed[i];
        if (
          typeof s === "object" &&
          s !== null &&
          "start" in s &&
          "end" in s &&
          "original" in s &&
          "replacement" in s
        ) {
          const item = s as Record<string, unknown>;
          const itemType = item.type;
          suggestions.push({
            id: `${Date.now()}-${i}`,
            start: Number(item.start),
            end: Number(item.end),
            original: String(item.original),
            replacement: String(item.replacement),
            type:
              itemType === "spelling" || itemType === "style"
                ? itemType
                : "grammar",
          });
        }
      }
      return suggestions;
    } catch {
      return [];
    }
  }

  async rewrite(text: string, style: RewriteStyle): Promise<string> {
    const systemPrompt = REWRITE_PROMPTS[style];
    console.log(
      "[Scribe] Calling Ollama rewrite, model:",
      this.model,
      "url:",
      this.baseUrl,
    );

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        prompt: `${systemPrompt}\n\nText: """\n${text}\n"""`,
        stream: false,
        options: {
          temperature: style === "fix" ? 0.1 : 0.4,
        },
      }),
    });

    console.log("[Scribe] Ollama response status:", response.status);

    if (!response.ok) {
      const body = await response.text();
      console.error("[Scribe] Ollama error body:", body);
      throw new Error(`Ollama returned ${response.status}`);
    }

    const data = await response.json();
    console.log("[Scribe] Ollama response received");
    return (data.response || "").trim();
  }
}
