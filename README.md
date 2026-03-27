<div align="right">
  <a href="README.zh-CN.md">简体中文</a>
</div>

# YT Downloader

> A minimal, beautiful desktop downloader for YouTube and 1000+ sites.

[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-555?style=flat-square)](https://github.com/awly333/yt-downloader/releases)
[![License](https://img.shields.io/badge/license-MIT-E8654A?style=flat-square)](LICENSE)
[![Built with Electron](https://img.shields.io/badge/built%20with-Electron-47848F?style=flat-square&logo=electron&logoColor=white)](https://www.electronjs.org)

---

## Overview

YT Downloader is a native desktop app for downloading videos and audio from YouTube and 1000+ other sites. Pick a URL, choose your format and quality, and download — no command line required.

Powered by [yt-dlp](https://github.com/yt-dlp/yt-dlp) and [FFmpeg](https://ffmpeg.org), both bundled inside the app. **No pre-installation needed.**

Built with Electron, React, and Tailwind CSS.

---

## Screenshots

> Screenshots coming soon.

---

## Features

- **Universal source support** — YouTube and 1000+ sites via yt-dlp
- **Format selection** — MP4, MKV, WebM, MP3, M4A, FLAC, WAV, Opus
- **Full format browser** — pick exact quality with resolution, codec, FPS, bitrate, and estimated file size
- **Subtitle downloads** — multiple languages and formats (SRT, VTT, ASS)
- **Browser cookie passthrough** — access age-restricted or private content via Chrome, Edge, Firefox, or Brave
- **Live progress** — real-time speed, ETA, and percentage for every download
- **Cancel & retry** — full control over in-progress downloads
- **Drag & drop** — drop a URL directly into the window
- **Custom output directory** — save anywhere
- **Auto-updater** — notified automatically when a new release is available
- **No setup required** — yt-dlp and FFmpeg are bundled; just install and run

---

## Installation

Download the latest installer from the [Releases page](https://github.com/awly333/yt-downloader/releases).

| Platform | Installer |
|----------|-----------|
| Windows | `YT-Downloader-Setup-x.x.x.exe` |
| macOS (Intel) | `YT-Downloader-x.x.x-mac-x64.dmg` |
| macOS (Apple Silicon) | `YT-Downloader-x.x.x-mac-arm64.dmg` |
| Linux | `YT-Downloader-x.x.x-linux-x64.AppImage` |

No additional software required. yt-dlp and FFmpeg are included.

---

## Build from Source

```bash
# Install dependencies
npm install

# Download bundled binaries (yt-dlp + ffmpeg)
npm run download-binaries

# Run in development
npm run dev

# Build for production
npm run electron:build

# Regenerate app icons
npm run icons
```

### Stack

| Layer | Technology |
|-------|-----------|
| Shell | Electron 41 |
| UI | React 19, TypeScript |
| Styling | Tailwind CSS 4, Framer Motion |
| State | Zustand |
| Bundler | Vite + esbuild |
| Downloader | yt-dlp + FFmpeg (bundled) |

---

## License

[MIT](LICENSE)
