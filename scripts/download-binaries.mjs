/**
 * download-binaries.mjs
 *
 * Prepares resources/bin/ with platform-specific yt-dlp and ffmpeg binaries
 * so the packaged app runs without any user-installed prerequisites.
 *
 * Usage:
 *   node scripts/download-binaries.mjs
 *   npm run download-binaries
 *
 * Requires: ffmpeg-static (devDependency)
 */

import { createRequire } from 'module'
import { existsSync, mkdirSync, copyFileSync, chmodSync, createWriteStream, unlinkSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import https from 'https'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const binDir = join(root, 'resources', 'bin')
mkdirSync(binDir, { recursive: true })

const isWin = process.platform === 'win32'
const ext  = isWin ? '.exe' : ''

const require = createRequire(import.meta.url)

// ─── 1. FFmpeg  (from ffmpeg-static npm package) ─────────────────────────────
try {
  const ffmpegSrc = require('ffmpeg-static')
  if (!ffmpegSrc || !existsSync(ffmpegSrc)) throw new Error('binary missing — run `npm install` first')
  const ffmpegDest = join(binDir, `ffmpeg${ext}`)
  copyFileSync(ffmpegSrc, ffmpegDest)
  if (!isWin) chmodSync(ffmpegDest, 0o755)
  console.log(`✓  ffmpeg   →  resources/bin/ffmpeg${ext}`)
} catch (err) {
  console.error('✗  ffmpeg  skipped:', err.message)
}

// ─── 2. FFprobe  (from @ffprobe-installer/ffprobe) ────────────────────────────
try {
  const { path: ffprobeSrc } = require('@ffprobe-installer/ffprobe')
  if (!ffprobeSrc || !existsSync(ffprobeSrc)) throw new Error('binary missing — run `npm install` first')
  const ffprobeDest = join(binDir, `ffprobe${ext}`)
  copyFileSync(ffprobeSrc, ffprobeDest)
  if (!isWin) chmodSync(ffprobeDest, 0o755)
  console.log(`✓  ffprobe  →  resources/bin/ffprobe${ext}`)
} catch (err) {
  console.error('✗  ffprobe skipped:', err.message)
}

// ─── 3. yt-dlp  (from GitHub releases) ───────────────────────────────────────
const ytdlpAsset = isWin
  ? 'yt-dlp.exe'
  : process.platform === 'darwin'
    ? 'yt-dlp_macos'
    : 'yt-dlp'

const ytdlpUrl  = `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${ytdlpAsset}`
const ytdlpDest = join(binDir, `yt-dlp${ext}`)

process.stdout.write(`⬇  yt-dlp  downloading…`)
try {
  await downloadFile(ytdlpUrl, ytdlpDest)
  if (!isWin) chmodSync(ytdlpDest, 0o755)
  console.log(`  ✓  yt-dlp  →  resources/bin/yt-dlp${ext}`)
} catch (err) {
  console.error(`\n✗  yt-dlp  failed: ${err.message}`)
  // Remove partial file
  try { if (existsSync(ytdlpDest)) unlinkSync(ytdlpDest) } catch {}
}

console.log('\nDone — resources/bin/ is ready.')

// ─── Helpers ──────────────────────────────────────────────────────────────────

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const out = createWriteStream(dest)

    const get = (u) => {
      https.get(u, { headers: { 'User-Agent': 'yt-downloader-build/1.0' } }, (res) => {
        // Follow redirects (GitHub issues 302 → objects.githubusercontent.com)
        if (res.statusCode === 301 || res.statusCode === 302) {
          res.resume()
          get(res.headers.location)
          return
        }
        if (res.statusCode !== 200) {
          res.resume()
          out.destroy()
          reject(new Error(`HTTP ${res.statusCode} from ${u}`))
          return
        }
        res.pipe(out)
        out.on('finish', () => out.close(resolve))
        out.on('error', reject)
      }).on('error', reject)
    }

    get(url)
  })
}
