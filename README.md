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

![YT Downloader](screenshot.png)

---

## Features

- **Universal source support** — YouTube and 1000+ sites via yt-dlp
- **Format selection** — MP4, MKV, WebM, MP3, M4A, FLAC, WAV, Opus
- **Full format browser** — pick exact quality with resolution, codec, FPS, bitrate, and estimated file size
- **Subtitle downloads** — multiple languages and formats (SRT, VTT, ASS)
- **Browser cookie passthrough** — access age-restricted or private content via Chrome, Edge, Firefox, Brave, or a local cookie file
- **Live progress** — real-time speed, ETA, and percentage for every download
- **Cancel & retry** — full control over in-progress downloads
- **Playlist support** — detect playlist URLs, select individual videos, and queue them all at once
- **Bandwidth limit** — cap download speed per task to avoid saturating your connection
- **Drag & drop** — drop a URL directly into the window
- **Custom output directory** — save anywhere
- **Auto-updater** — notified automatically when a new release is available
- **No setup required** — yt-dlp and FFmpeg are bundled; just install and run

---

## Using Local Cookie Files

Some videos require you to be logged in to download (age-restricted content, member-only videos, etc.). YT Downloader supports two ways to pass cookies:

- **Browser mode** — reads cookies directly from an installed browser (Chrome, Edge, Firefox, Brave). Simple, but the browser must be closed first on some systems.
- **Local mode** — you export a cookie file manually and drop it in a folder. More reliable and works even when no browser is installed.

### How to export a cookie file

1. Install the **[Get cookies.txt LOCALLY](https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc)** extension in Chrome or Edge.
2. Log in to YouTube (or whichever site you want to download from).
3. Navigate to the site, click the extension icon, and click **Export** — this downloads a `.txt` file in Netscape cookie format.

### Where to put the cookie file

1. In YT Downloader, go to **Settings → Cookie browser → Local**. A folder path will appear — click it to open the folder directly.
2. Copy your exported `.txt` file into that folder.
3. Done. The app automatically picks the **most recently modified** `.txt` file in that folder, so you can keep multiple files there and the latest one always wins.

### Using it

Back on the main screen, check **Use browser cookies**, select **Local** from the dropdown. The cookies folder path will appear below — click it any time to open and manage your cookie files.

> **Tip:** Cookie files expire when your browser session expires. If downloads start failing again, re-export the cookie file and replace the old one.

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
