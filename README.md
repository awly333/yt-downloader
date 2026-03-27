# YT Downloader

> A minimal, beautiful desktop downloader for YouTube and 1000+ sites.

[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey?style=flat-square)](https://github.com/awly333/yt-downloader/releases)
[![License](https://img.shields.io/badge/license-MIT-orange?style=flat-square&color=E8654A)](LICENSE)
[![Built with Electron](https://img.shields.io/badge/built%20with-Electron-47848F?style=flat-square&logo=electron&logoColor=white)](https://www.electronjs.org)

---

## Overview

YT Downloader is a native desktop app that wraps [yt-dlp](https://github.com/yt-dlp/yt-dlp) in a clean, distraction-free interface. Pick a URL, choose your format and quality, download. That's it.

Built with Electron, React, and Tailwind CSS — designed to feel at home on any modern desktop.

---

## Screenshots

> Screenshots coming soon.

---

## Features

- **Universal source support** — YouTube and 1000+ sites via yt-dlp
- **Format selection** — MP4, MKV, WebM, MP3, M4A, FLAC, WAV, Opus
- **Full format browser** — pick exact quality with resolution, codec, FPS, bitrate, and file size
- **Subtitle downloads** — multiple languages and formats
- **Browser cookie passthrough** — access age-restricted or private content via Chrome, Edge, Firefox, or Brave cookies
- **Live progress** — real-time speed, ETA, and percentage for every download
- **Cancel & retry** — full control over in-progress downloads
- **Drag & drop** — paste or drop a URL directly into the window
- **Custom output directory** — save anywhere you want
- **Auto-updater** — notified when a new release is available on GitHub
- **Frameless window** — custom title bar with native controls, no chrome clutter
- **Warm light theme** — system-aware, easy on the eyes

---

## Installation

Download the latest release from the [Releases page](https://github.com/awly333/yt-downloader/releases).

| Platform | File |
|----------|------|
| Windows  | `YT-Downloader-Setup-x.x.x.exe` |
| macOS (Intel) | `YT-Downloader-x.x.x-mac-x64.dmg` |
| macOS (Apple Silicon) | `YT-Downloader-x.x.x-mac-arm64.dmg` |
| Linux | `YT-Downloader-x.x.x-linux-x64.AppImage` |

### Prerequisite

YT Downloader requires **yt-dlp** to be installed and available in your `PATH`.

```
# Install yt-dlp
pip install yt-dlp

# Or via Homebrew (macOS)
brew install yt-dlp
```

Full installation instructions: [yt-dlp on GitHub](https://github.com/yt-dlp/yt-dlp)

---

## Build from Source

```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Build for production
npm run electron:build

# Regenerate app icons (requires @resvg/resvg-js)
node scripts/generate-icons.mjs
```

### Stack

| Layer | Technology |
|-------|-----------|
| Shell | Electron 41 |
| UI | React 19, TypeScript |
| Styling | Tailwind CSS 4, Framer Motion |
| State | Zustand |
| Bundler | Vite |

---

## License

[MIT](LICENSE) — free to use, modify, and distribute.
