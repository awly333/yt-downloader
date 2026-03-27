import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'
import type { VideoInfo, SubtitleTrack, ParsedVideoFormat, DownloadOptions, DownloadProgress } from '../shared/types'

// ── Bundled binary resolution ─────────────────────────────────

function getResourcesDir(): string {
  if (app.isPackaged) {
    // Packaged: binaries are in <resourcesPath>/bin/
    return process.resourcesPath
  }
  // Development: project root/resources/  (__dirname = dist-electron/main/)
  return path.join(__dirname, '..', '..', 'resources')
}

function getBinPath(name: string): string {
  const ext = process.platform === 'win32' ? '.exe' : ''
  return path.join(getResourcesDir(), 'bin', `${name}${ext}`)
}

/** Ensure bundled binaries are executable on macOS/Linux (safe no-op on Windows). */
export function ensureBinariesExecutable(): void {
  if (process.platform === 'win32') return
  for (const name of ['yt-dlp', 'ffmpeg']) {
    const bin = getBinPath(name)
    try {
      if (fs.existsSync(bin)) fs.chmodSync(bin, 0o755)
    } catch {
      // Non-fatal — binary may still be executable from the download step
    }
  }
}

// ── Parse URL ────────────────────────────────────────────────

export async function parseUrl(url: string, cookieBrowser?: string): Promise<VideoInfo> {
  return new Promise((resolve, reject) => {
    const ytdlpBin = getBinPath('yt-dlp')
    const ffmpegBin = getBinPath('ffmpeg')

    const args = ['--dump-json', '--no-warnings', '--ffmpeg-location', ffmpegBin]
    if (cookieBrowser) args.push('--cookies-from-browser', cookieBrowser)
    args.push(url)

    const proc = spawn(ytdlpBin, args, {
      windowsHide: true,
    })

    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (data: Buffer) => {
      stdout += data.toString()
    })

    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString()
    })

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `yt-dlp exited with code ${code}`))
        return
      }

      try {
        const raw = JSON.parse(stdout)
        resolve(transformVideoInfo(raw, url))
      } catch (e) {
        reject(new Error(`Failed to parse yt-dlp output: ${(e as Error).message}`))
      }
    })

    proc.on('error', (err) => {
      const msg = (err as NodeJS.ErrnoException).code === 'ENOENT'
        ? `yt-dlp not found at ${getBinPath('yt-dlp')}. Run: npm run download-binaries`
        : `Failed to run yt-dlp: ${err.message}`
      reject(new Error(msg))
    })
  })
}

function transformVideoInfo(raw: any, originalUrl: string): VideoInfo {
  // Extract available resolutions from formats
  const resolutions = new Set<string>()
  const formats = (raw.formats || []).map((f: any) => {
    if (f.height && f.vcodec !== 'none') {
      resolutions.add(`${f.height}p`)
    }
    return {
      format_id: f.format_id || '',
      format_note: f.format_note || '',
      ext: f.ext || '',
      resolution: f.resolution || 'audio only',
      fps: f.fps || null,
      vcodec: f.vcodec || 'none',
      acodec: f.acodec || 'none',
      filesize: f.filesize || null,
      filesize_approx: f.filesize_approx || null,
    }
  })

  // Sort resolutions descending
  const sortedResolutions = Array.from(resolutions)
    .sort((a, b) => parseInt(b) - parseInt(a))

  // Extract subtitles
  const subtitles: SubtitleTrack[] = []

  // Manual subtitles
  if (raw.subtitles) {
    for (const [lang, tracks] of Object.entries(raw.subtitles)) {
      const trackList = tracks as any[]
      if (trackList.length > 0) {
        subtitles.push({
          language: lang,
          languageName: getLanguageName(lang),
          ext: trackList[0].ext || 'vtt',
          url: trackList[0].url || '',
          isAutomatic: false,
        })
      }
    }
  }

  // Auto-generated subtitles
  if (raw.automatic_captions) {
    for (const [lang, tracks] of Object.entries(raw.automatic_captions)) {
      const trackList = tracks as any[]
      // Skip if manual subtitle already exists for this language
      if (subtitles.some((s) => s.language === lang)) continue
      if (trackList.length > 0) {
        subtitles.push({
          language: lang,
          languageName: getLanguageName(lang),
          ext: trackList[0].ext || 'vtt',
          url: trackList[0].url || '',
          isAutomatic: true,
        })
      }
    }
  }

  // Build detailed video and audio format lists — NO deduplication
  // Show every format_id from yt-dlp, like the reference app
  const videoFormats: ParsedVideoFormat[] = []
  const audioFormats: ParsedVideoFormat[] = []

  for (const f of (raw.formats || [])) {
    const size = f.filesize || f.filesize_approx || null
    const sizeStr = size ? formatFileSize(size) : ''
    const fmtId = f.format_id || ''
    const lang = f.language ? ` ${f.language}` : ''

    if (f.vcodec && f.vcodec !== 'none' && f.height) {
      const codecShort = getCodecShort(f.vcodec)
      const fps = f.fps ? `${Math.round(f.fps)} FPS` : ''
      const tbr = f.tbr ? `${Math.round(f.tbr)}k` : ''
      const container = (f.ext || '').toUpperCase()

      // Format: "1920x1080 | H.264 | 30 FPS | MP4 | 1234k | 50.00 MiB (137)"
      const parts = [
        `${f.width || '?'}x${f.height}`,
        lang ? lang.trim() : null,
        codecShort,
        fps,
        container,
        tbr,
        sizeStr ? `${sizeStr}` : null,
        `(${fmtId})`,
      ].filter(Boolean)

      videoFormats.push({
        label: parts.join(' | '),
        value: fmtId,
        type: 'video',
        resolution: `${f.width || '?'}x${f.height}`,
        fps: f.fps || undefined,
        ext: f.ext || '',
        filesize: size || undefined,
        codec: f.vcodec || '',
      })
    } else if (f.acodec && f.acodec !== 'none' && (f.vcodec === 'none' || !f.vcodec)) {
      const codecShort = getCodecShort(f.acodec)
      const abr = f.abr ? `${Math.round(f.abr)}k` : (f.tbr ? `${Math.round(f.tbr)}k` : '')
      const container = (f.ext || '').toUpperCase()

      // Format: "128k | en | MP4A | 10.00 MiB (140)"
      const parts = [
        abr || f.format_note || 'audio',
        lang ? lang.trim() : null,
        codecShort,
        container,
        sizeStr ? `${sizeStr}` : null,
        `(${fmtId})`,
      ].filter(Boolean)

      audioFormats.push({
        label: parts.join(' | '),
        value: fmtId,
        type: 'audio',
        ext: f.ext || '',
        filesize: size || undefined,
        codec: f.acodec || '',
        bitrate: abr || undefined,
      })
    }
  }

  // Sort video: highest resolution first, then fps, then bitrate
  videoFormats.sort((a, b) => {
    const aH = parseInt(a.resolution?.split('x')[1] || '0')
    const bH = parseInt(b.resolution?.split('x')[1] || '0')
    if (bH !== aH) return bH - aH
    return (b.fps || 0) - (a.fps || 0)
  })

  // Sort audio: highest bitrate first
  audioFormats.sort((a, b) => {
    const aB = parseInt(a.bitrate || '0')
    const bB = parseInt(b.bitrate || '0')
    return bB - aB
  })

  return {
    id: raw.id || '',
    title: raw.title || 'Untitled',
    description: raw.description || '',
    thumbnail: raw.thumbnail || '',
    duration: raw.duration || 0,
    uploader: raw.uploader || raw.channel || '',
    url: originalUrl,
    formats,
    subtitles,
    availableResolutions: sortedResolutions,
    videoFormats,
    audioFormats,
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}GB`
}

function getCodecShort(codec: string): string {
  if (!codec || codec === 'none') return ''
  if (codec.startsWith('avc1') || codec.startsWith('h264')) return 'H.264'
  if (codec.startsWith('hev1') || codec.startsWith('hvc1') || codec.startsWith('h265')) return 'H.265'
  if (codec.startsWith('vp9') || codec.startsWith('vp09')) return 'VP9'
  if (codec.startsWith('av01')) return 'AV1'
  if (codec.startsWith('mp4a') || codec.startsWith('aac')) return 'AAC'
  if (codec.startsWith('opus')) return 'Opus'
  if (codec.startsWith('vorbis')) return 'Vorbis'
  if (codec.startsWith('mp3') || codec.startsWith('mp4a.6b')) return 'MP3'
  if (codec.startsWith('flac')) return 'FLAC'
  return codec.split('.')[0].toUpperCase()
}

// Fallback for language codes that Electron's bundled ICU may not resolve
const LANG_FALLBACK: Record<string, string> = {
  ab: 'Abkhazian', aa: 'Afar', af: 'Afrikaans', ak: 'Akan', sq: 'Albanian',
  am: 'Amharic', ar: 'Arabic', an: 'Aragonese', hy: 'Armenian', as: 'Assamese',
  av: 'Avaric', ae: 'Avestan', ay: 'Aymara', az: 'Azerbaijani', bm: 'Bambara',
  ba: 'Bashkir', eu: 'Basque', be: 'Belarusian', bn: 'Bengali', bi: 'Bislama',
  bs: 'Bosnian', br: 'Breton', bg: 'Bulgarian', my: 'Burmese', ca: 'Catalan',
  ch: 'Chamorro', ce: 'Chechen', ny: 'Chichewa', cv: 'Chuvash', kw: 'Cornish',
  co: 'Corsican', cr: 'Cree', hr: 'Croatian', cs: 'Czech', da: 'Danish',
  dv: 'Divehi', nl: 'Dutch', dz: 'Dzongkha', en: 'English', eo: 'Esperanto',
  et: 'Estonian', ee: 'Ewe', fo: 'Faroese', fj: 'Fijian', fi: 'Finnish',
  fr: 'French', ff: 'Fula', gl: 'Galician', ka: 'Georgian', de: 'German',
  el: 'Greek', gn: 'Guaraní', gu: 'Gujarati', ht: 'Haitian Creole', ha: 'Hausa',
  he: 'Hebrew', hz: 'Herero', hi: 'Hindi', ho: 'Hiri Motu', hu: 'Hungarian',
  ia: 'Interlingua', id: 'Indonesian', ie: 'Interlingue', ga: 'Irish', ig: 'Igbo',
  ik: 'Inupiaq', io: 'Ido', is: 'Icelandic', it: 'Italian', iu: 'Inuktitut',
  ja: 'Japanese', jv: 'Javanese', kl: 'Kalaallisut', kn: 'Kannada', kr: 'Kanuri',
  ks: 'Kashmiri', kk: 'Kazakh', km: 'Khmer', ki: 'Kikuyu', rw: 'Kinyarwanda',
  ky: 'Kyrgyz', kv: 'Komi', kg: 'Kongo', ko: 'Korean', ku: 'Kurdish',
  kj: 'Kwanyama', la: 'Latin', lb: 'Luxembourgish', lg: 'Luganda', li: 'Limburgish',
  ln: 'Lingala', lo: 'Lao', lt: 'Lithuanian', lu: 'Luba-Katanga', lv: 'Latvian',
  gv: 'Manx', mk: 'Macedonian', mg: 'Malagasy', ms: 'Malay', ml: 'Malayalam',
  mt: 'Maltese', mi: 'Māori', mr: 'Marathi', mh: 'Marshallese', mn: 'Mongolian',
  na: 'Nauru', nv: 'Navajo', nd: 'North Ndebele', ne: 'Nepali', ng: 'Ndonga',
  nb: 'Norwegian Bokmål', nn: 'Norwegian Nynorsk', no: 'Norwegian', ii: 'Nuosu',
  nr: 'South Ndebele', oc: 'Occitan', oj: 'Ojibwe', cu: 'Old Church Slavonic',
  om: 'Oromo', or: 'Oriya', os: 'Ossetian', pa: 'Punjabi', pi: 'Pāli',
  fa: 'Persian', pl: 'Polish', ps: 'Pashto', pt: 'Portuguese', qu: 'Quechua',
  rm: 'Romansh', rn: 'Kirundi', ro: 'Romanian', ru: 'Russian', sa: 'Sanskrit',
  sc: 'Sardinian', sd: 'Sindhi', se: 'Northern Sami', sm: 'Samoan', sg: 'Sango',
  sr: 'Serbian', gd: 'Scottish Gaelic', sn: 'Shona', si: 'Sinhala', sk: 'Slovak',
  sl: 'Slovenian', so: 'Somali', st: 'Southern Sotho', es: 'Spanish', su: 'Sundanese',
  sw: 'Swahili', ss: 'Swati', sv: 'Swedish', ta: 'Tamil', te: 'Telugu',
  tg: 'Tajik', th: 'Thai', ti: 'Tigrinya', bo: 'Tibetan', tk: 'Turkmen',
  tl: 'Tagalog', tn: 'Tswana', to: 'Tonga', tr: 'Turkish', ts: 'Tsonga',
  tt: 'Tatar', tw: 'Twi', ty: 'Tahitian', ug: 'Uyghur', uk: 'Ukrainian',
  ur: 'Urdu', uz: 'Uzbek', ve: 'Venda', vi: 'Vietnamese', vo: 'Volapük',
  wa: 'Walloon', cy: 'Welsh', wo: 'Wolof', fy: 'Western Frisian', xh: 'Xhosa',
  yi: 'Yiddish', yo: 'Yoruba', za: 'Zhuang', zu: 'Zulu',
  // Extended / regional codes common in YouTube auto-captions
  iw: 'Hebrew', fil: 'Filipino', zh: 'Chinese', 'zh-Hans': 'Chinese (Simplified)',
  'zh-Hant': 'Chinese (Traditional)', 'pt-BR': 'Portuguese (Brazil)',
  'pt-PT': 'Portuguese (Portugal)', 'es-419': 'Spanish (Latin America)',
  'fr-CA': 'French (Canada)', 'en-US': 'English (US)', 'en-GB': 'English (UK)',
  kha: 'Khasi', ban: 'Balinese', min: 'Minangkabau',
  ckb: 'Sorani Kurdish', pam: 'Kapampangan', ceb: 'Cebuano', hmn: 'Hmong',
  haw: 'Hawaiian',
}

function getLanguageName(code: string): string {
  try {
    const names = new Intl.DisplayNames(['en'], { type: 'language' })
    const resolved = names.of(code)
    // Intl returns the code itself when it can't resolve it
    if (resolved && resolved !== code) return resolved
    return LANG_FALLBACK[code] ?? LANG_FALLBACK[code.split('-')[0]] ?? code
  } catch {
    return LANG_FALLBACK[code] ?? LANG_FALLBACK[code.split('-')[0]] ?? code
  }
}

// ── Download ─────────────────────────────────────────────────

interface ActiveDownload {
  proc: ChildProcess
  options: DownloadOptions
}

const activeDownloads = new Map<string, ActiveDownload>()

export function startDownload(
  taskId: string,
  options: DownloadOptions,
  onProgress: (progress: DownloadProgress) => void,
): void {
  const ytdlpBin = getBinPath('yt-dlp')
  const ffmpegBin = getBinPath('ffmpeg')
  const args = buildYtdlpArgs(options, ffmpegBin)
  console.log('[yt-dlp] spawning:', ytdlpBin, args.join(' '))

  const proc = spawn(ytdlpBin, args, { windowsHide: true })
  activeDownloads.set(taskId, { proc, options })

  let stderrBuf = ''

  proc.stdout.on('data', (data: Buffer) => {
    const lines = data.toString().split('\n')
    for (const line of lines) {
      const progress = parseProgressLine(taskId, line)
      if (progress) {
        onProgress(progress)
      }
    }
  })

  proc.stderr.on('data', (data: Buffer) => {
    const text = data.toString()
    stderrBuf += text
    if (text.trim()) {
      console.error(`[yt-dlp stderr] ${text.trim()}`)
    }
  })

  proc.on('close', (code) => {
    activeDownloads.delete(taskId)
    if (code === 0) {
      onProgress({
        taskId,
        percent: 100,
        speed: '',
        eta: '',
        status: 'completed',
      })
    } else {
      const errMsg = stderrBuf.trim()
      // Extract the last meaningful error line from stderr
      const lastLine = errMsg.split('\n').filter(l => l.trim()).pop() || ''
      onProgress({
        taskId,
        percent: 0,
        speed: '',
        eta: '',
        status: 'failed',
        error: lastLine || `yt-dlp exited with code ${code}`,
      })
    }
  })

  proc.on('error', (err) => {
    activeDownloads.delete(taskId)
    onProgress({
      taskId,
      percent: 0,
      speed: '',
      eta: '',
      status: 'failed',
      error: err.message,
    })
  })
}

export function cancelDownload(taskId: string): void {
  const entry = activeDownloads.get(taskId)
  if (!entry) return

  entry.proc.kill('SIGTERM')
  activeDownloads.delete(taskId)

  // Clean up partial/temp files left by yt-dlp
  cleanupPartialFiles(entry.options)
}

/**
 * Delete residual files left by a cancelled download.
 * yt-dlp creates files like:
 *   filename.ext.part        — partial download
 *   filename.fNNN.ext        — format-specific temp streams
 *   filename.ext             — partially merged output
 *   filename.temp.ext        — temp file
 * We glob for everything matching `${saveDir}/${fileName}.*` and delete.
 */
function cleanupPartialFiles(options: DownloadOptions): void {
  const { saveDir, fileName } = options
  try {
    const files = fs.readdirSync(saveDir)
    const prefix = fileName + '.'
    for (const file of files) {
      if (file.startsWith(prefix)) {
        const fullPath = path.join(saveDir, file)
        try {
          fs.unlinkSync(fullPath)
          console.log(`[cleanup] Deleted: ${fullPath}`)
        } catch (err) {
          console.error(`[cleanup] Failed to delete ${fullPath}:`, err)
        }
      }
    }
  } catch (err) {
    console.error('[cleanup] Failed to read directory:', err)
  }
}

function buildYtdlpArgs(options: DownloadOptions, ffmpegBin: string): string[] {
  const outputPath = path.join(options.saveDir, `${options.fileName}.%(ext)s`)
  const args: string[] = [
    '--newline',           // Force progress on separate lines
    '-o', outputPath,
    '--no-warnings',
    '--ffmpeg-location', ffmpegBin,
  ]

  const isAudioOnly = ['mp3', 'm4a', 'wav', 'aac', 'opus', 'flac'].includes(options.fileType)

  if (isAudioOnly) {
    // Audio extraction
    args.push('-x')  // extract audio
    args.push('--audio-format', options.fileType)
    if (options.audioFormat !== 'best') {
      args.push('-f', `bestaudio[abr<=${getAudioBitrate(options.audioFormat)}]/bestaudio`)
    }
  } else {
    // Video download
    const formatStr = buildVideoFormatString(options.videoFormat, options.audioFormat)
    args.push('-f', formatStr)
    args.push('--merge-output-format', options.fileType)
  }

  // Cookies
  if (options.useCookies) {
    args.push('--cookies-from-browser', options.cookieBrowser)
  }

  // Subtitles — use both flags so manual and auto-generated subs both work
  if (options.subtitleLangs.length > 0) {
    args.push('--write-sub')
    args.push('--write-auto-sub')
    args.push('--sub-langs', options.subtitleLangs.join(','))
    if (options.subtitleFormat && options.subtitleFormat !== 'original') {
      args.push('--convert-subs', options.subtitleFormat)
    }
  }

  args.push(options.url)

  return args
}

function buildVideoFormatString(videoFormat: string, audioFormat: string): string {
  let video = 'bestvideo'
  let audio = 'bestaudio'

  if (videoFormat === 'worst') {
    video = 'worstvideo'
  } else if (videoFormat !== 'best') {
    // Could be a format_id (numeric) or resolution like '1080p'
    const height = parseInt(videoFormat)
    if (height && videoFormat.endsWith('p')) {
      video = `bestvideo[height<=${height}]`
    } else {
      // Specific format ID from yt-dlp
      video = videoFormat
    }
  }

  if (audioFormat === 'worst') {
    audio = 'worstaudio'
  } else if (audioFormat !== 'best') {
    // Specific audio format ID
    audio = audioFormat
  }

  return `${video}+${audio}/best`
}

function getAudioBitrate(format: string): string {
  switch (format) {
    case 'worst': return '64'
    default: return '320'
  }
}

// ── Parse yt-dlp progress output ─────────────────────────────

function parseProgressLine(taskId: string, line: string): DownloadProgress | null {
  const trimmed = line.trim()

  // Match: [download]  45.2% of ~50.00MiB at 2.50MiB/s ETA 00:15
  const downloadMatch = trimmed.match(
    /\[download\]\s+([\d.]+)%\s+of\s+~?[\d.]+\w+\s+at\s+([\d.]+\w+\/s)\s+ETA\s+(\S+)/
  )
  if (downloadMatch) {
    return {
      taskId,
      percent: parseFloat(downloadMatch[1]),
      speed: downloadMatch[2],
      eta: downloadMatch[3],
      status: 'downloading',
    }
  }

  // Match: [download] 100% of 50.00MiB
  const completeMatch = trimmed.match(/\[download\]\s+100%/)
  if (completeMatch) {
    return {
      taskId,
      percent: 100,
      speed: '',
      eta: '',
      status: 'downloading',
    }
  }

  // Match: [Merger] Merging formats into ...
  if (trimmed.startsWith('[Merger]') || trimmed.startsWith('[ExtractAudio]')) {
    return {
      taskId,
      percent: 100,
      speed: '',
      eta: '',
      status: 'merging',
    }
  }

  return null
}
