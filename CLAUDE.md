# Scribe - Claude Code Instructions

## Project Overview

Browser extension for local AI grammar checking via Ollama. Chrome MV3, TypeScript, Vite.

## Architecture

```
src/
  background/     Service worker - Ollama API, message handling
  content/        Content script - DOM interaction, UI
    handlers/     Input type handlers (textarea, contenteditable)
    overlay/      Shadow DOM UI (underlines, tooltip, panel)
  popup/          Settings UI
  types/          Shared TypeScript definitions
```

## Key Files

- `src/background/ollama.ts` - Ollama API client, prompts
- `src/content/index.ts` - Main orchestration
- `src/content/detector.ts` - Input field detection
- `src/content/analyzer.ts` - Debounced analysis
- `src/content/overlay/container.ts` - Shadow DOM root

## Build

```bash
npm run build   # Production
npm run dev     # Development with hot reload
```

## Testing

Load `dist/` folder as unpacked extension. Requires Ollama running with `OLLAMA_ORIGINS='*'`.

## Common Tasks

- Add new rewrite mode: Update `REWRITE_PROMPTS` in `ollama.ts` and `REWRITE_LABELS` in `types/index.ts`
- Modify analysis prompt: Edit `ANALYZE_PROMPT` in `ollama.ts`
- Add input type support: Create handler in `content/handlers/`, register in `content/handlers/index.ts`
- Style overlay UI: Edit styles in `content/overlay/container.ts`
