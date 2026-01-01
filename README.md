# Scribe

Local AI-powered grammar checking and text rewriting browser extension. Powered by Ollama.

## Features

- Real-time grammar, spelling, and style error detection
- Inline underlines with hover tooltips showing corrections
- Click to apply individual corrections
- Selection-based rewriting with multiple modes:
  - Fix Grammar
  - Shorten
  - Formal
  - Casual
  - Expand
- Context-aware single-word corrections
- Works on any website with text inputs

## Requirements

- Ollama running locally with CORS enabled
- A compatible model (default: gemma3:4b)

## Setup

1. Start Ollama with CORS enabled:

   ```bash
   OLLAMA_ORIGINS='*' ollama serve
   ```

2. Pull the default model:

   ```bash
   ollama pull gemma3:4b
   ```

3. Build the extension:

   ```bash
   npm install
   npm run build
   ```

4. Load in browser:
   - Open `chrome://extensions` (or `vivaldi://extensions`)
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

## Development

```bash
npm run dev    # Hot reload development
npm run build  # Production build
```

## Configuration

Click the extension icon to access settings:

- Enable/disable Scribe
- Select Ollama model
- Configure Ollama URL (default: http://localhost:11434)
