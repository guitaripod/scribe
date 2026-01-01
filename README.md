# Scribe

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Manifest V3](https://img.shields.io/badge/Chrome-Manifest%20V3-4285f4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/)
[![Ollama](https://img.shields.io/badge/Ollama-Local%20AI-000000?logo=ollama&logoColor=white)](https://ollama.ai/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646cff?logo=vite&logoColor=white)](https://vitejs.dev/)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)

Local AI-powered grammar checking and text rewriting browser extension. Powered by Ollama.

![Demo](demo.gif)

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

## Ollama GPU Usage

By default, Ollama keeps models loaded in GPU memory for fast responses. To automatically unload models after a period of inactivity:

**Linux (systemd):**

```bash
sudo mkdir -p /etc/systemd/system/ollama.service.d
sudo tee /etc/systemd/system/ollama.service.d/override.conf << 'EOF'
[Service]
Environment="OLLAMA_ORIGINS=*"
Environment="OLLAMA_KEEP_ALIVE=1m"
EOF
sudo systemctl daemon-reload
sudo systemctl restart ollama
```

**macOS:**

```bash
launchctl setenv OLLAMA_ORIGINS "*"
launchctl setenv OLLAMA_KEEP_ALIVE "1m"
```

Then restart Ollama.

This keeps models loaded for 1 minute after the last request, then frees GPU memory. Adjust `1m` to your preference (`5m`, `30s`, `0` for immediate unload).
