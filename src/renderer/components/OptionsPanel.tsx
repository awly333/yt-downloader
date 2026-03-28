import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Folder, Globe, Download, X, Check } from 'lucide-react'
import { Dropdown } from './Dropdown'
import { useAppStore } from '../stores/appStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useDownloadStore } from '../stores/downloadStore'
import type { DownloadOptions, DownloadTask, SubtitleTrack } from '../../shared/types'
import { useTranslation } from '../i18n'

const AUDIO_ONLY_TYPES = ['mp3', 'm4a', 'wav', 'aac', 'opus', 'flac']

export function OptionsPanel() {
  const { parsedVideo, resetParse, useCookies } = useAppStore()
  const { settings } = useSettingsStore()
  const { addTask } = useDownloadStore()
  const t = useTranslation()

  const FILE_TYPE_OPTIONS = [
    { value: 'mp4', label: 'MP4', sublabel: t.ftVideoCompatible },
    { value: 'mkv', label: 'MKV', sublabel: t.ftVideoHighQuality },
    { value: 'webm', label: 'WebM', sublabel: t.ftVideoWebOptimized },
    { value: 'avi', label: 'AVI', sublabel: t.ftVideoLegacy },
    { value: 'mp3', label: 'MP3', sublabel: t.ftAudioUniversal },
    { value: 'm4a', label: 'M4A', sublabel: t.ftAudioAac },
    { value: 'opus', label: 'Opus', sublabel: t.ftAudioModern },
    { value: 'wav', label: 'WAV', sublabel: t.ftAudioLosslessLarge },
    { value: 'flac', label: 'FLAC', sublabel: t.ftAudioLosslessCompressed },
    { value: 'aac', label: 'AAC', sublabel: t.ftAudioHighQuality },
  ]

  const SUBTITLE_FORMAT_OPTIONS = [
    { value: 'original', label: 'Original', sublabel: t.sfKeepAsDownloaded },
    { value: 'srt', label: 'SRT', sublabel: t.sfMostCompatible },
    { value: 'vtt', label: 'VTT', sublabel: t.sfWebStandard },
    { value: 'ass', label: 'ASS', sublabel: t.sfAdvancedStyling },
    { value: 'lrc', label: 'LRC', sublabel: t.sfLyricsFormat },
  ]

  const [fileName, setFileName] = useState('')
  const [saveDir, setSaveDir] = useState('')
  const [fileType, setFileType] = useState('mp4')
  const [videoFormat, setVideoFormat] = useState('best')
  const [audioFormat, setAudioFormat] = useState('best')
  const [selectedSubs, setSelectedSubs] = useState<string[]>([])
  const [subtitleFormat, setSubtitleFormat] = useState('original')
  const subtitleContainerRef = useRef<HTMLDivElement>(null)
  const autoSelectedVideoRef = useRef<string | null>(null)

  useEffect(() => {
    if (parsedVideo) {
      setFileName(sanitizeFileName(parsedVideo.title))
      // Auto-select subtitle only when a new video is parsed
      if (autoSelectedVideoRef.current !== parsedVideo.url) {
        autoSelectedVideoRef.current = parsedVideo.url
        const best = pickBestSubtitle(parsedVideo.subtitles, settings.language)
        setSelectedSubs(best ? [best] : [])
      }
    }
    setSaveDir(settings.downloadDir)
    setFileType(settings.defaultFileType)
    setVideoFormat(settings.defaultVideoFormat)
    setAudioFormat(settings.defaultAudioFormat)
    setSubtitleFormat(settings.defaultSubtitleFormat || 'original')
  }, [parsedVideo, settings])

  // Auto-scroll subtitle list to the selected item after selection
  useEffect(() => {
    if (selectedSubs.length === 0 || !subtitleContainerRef.current) return
    const lang = selectedSubs[0]
    const el = subtitleContainerRef.current.querySelector(`[data-lang="${lang}"]`)
    if (!el) return
    const timer = setTimeout(() => el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 300)
    return () => clearTimeout(timer)
  }, [selectedSubs])

  if (!parsedVideo) return null

  const isAudioOnly = AUDIO_ONLY_TYPES.includes(fileType)

  // Build video format options: Best, Worst first, then all specific formats
  const videoFormatOptions = [
    { value: 'best', label: t.bestQuality },
    { value: 'worst', label: t.worstQuality },
    ...parsedVideo.videoFormats.map((f) => {
      const [resW, resH] = (f.resolution || '').split('x')
      // Use width as the primary resolution label (3840p, 1920p, 1280p…)
      // Fall back to height if width is missing or '?'
      const resPx = resW && resW !== '?' ? resW : resH
      const fps = f.fps && Math.round(f.fps) >= 24 ? `${Math.round(f.fps)}fps` : null
      const codec = codecShort(f.codec)
      const size = f.filesize ? fmtSize(f.filesize) : null
      return {
        value: f.value,
        label: [resPx ? `${resPx}p` : '?', fps].filter(Boolean).join(' · '),
        sublabel: [codec, f.ext?.toUpperCase(), size].filter(Boolean).join(' · '),
      }
    }),
  ]

  // Build audio format options: Best, Worst first, then all specific formats
  const audioFormatOptions = [
    { value: 'best', label: t.bestQuality },
    { value: 'worst', label: t.worstQuality },
    ...parsedVideo.audioFormats.map((f) => {
      const bitrate = f.bitrate || null
      const codec = codecShort(f.codec)
      const size = f.filesize ? fmtSize(f.filesize) : null
      return {
        value: f.value,
        label: [bitrate, codec].filter(Boolean).join(' '),
        sublabel: [f.ext?.toUpperCase(), size].filter(Boolean).join(' · '),
      }
    }),
  ]

  const handleSelectFolder = async () => {
    const selected = await window.electronAPI.selectFolder(saveDir)
    if (selected) setSaveDir(selected)
  }

  const handleToggleSub = (lang: string) => {
    setSelectedSubs((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    )
  }

  const handleDownload = async () => {
    const options: DownloadOptions = {
      url: parsedVideo.url,
      fileName,
      saveDir,
      fileType,
      videoFormat: isAudioOnly ? 'best' : videoFormat,
      audioFormat,
      useCookies,
      cookieBrowser: settings.cookieBrowser,
      subtitleLangs: selectedSubs,
      subtitleFormat,
    }

    try {
      const taskId = await window.electronAPI.startDownload(options)
      const task: DownloadTask = {
        id: taskId,
        options,
        thumbnail: parsedVideo.thumbnail,
        status: 'downloading',
        progress: 0,
        speed: '',
        eta: '',
        filePath: null,
        error: null,
        createdAt: Date.now(),
      }
      addTask(task)
      resetParse()
    } catch (err) {
      console.error('Failed to start download:', err)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }}
      transition={{ duration: 0.55, ease: [0, 0, 0.2, 1] }}
      className="w-full mt-5"
    >
      <div className="
        bg-surface-raised rounded-[--radius-lg]
        border border-border
        shadow-[0_4px_24px_rgba(0,0,0,0.05)]
        overflow-hidden
      ">
        {/* Video info header */}
        <div className="flex items-start justify-between p-5 pb-4 border-b border-border-subtle">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            {parsedVideo.thumbnail && (
              <img
                src={parsedVideo.thumbnail}
                alt=""
                className="w-20 h-12 rounded-[--radius-md] object-cover flex-shrink-0 shadow-sm"
              />
            )}
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-text-primary truncate leading-snug">
                {parsedVideo.title}
              </p>
              <p className="text-[11px] text-text-tertiary mt-1 flex items-center gap-1.5">
                {parsedVideo.uploader}
                {parsedVideo.duration > 0 && (
                  <>
                    <span className="text-border">·</span>
                    {formatDuration(parsedVideo.duration)}
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={resetParse}
            className="p-1.5 -mt-0.5 -mr-1 rounded-[--radius-sm] hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-text-tertiary" />
          </button>
        </div>

        {/* Options body */}
        <div className="p-5 space-y-4">
          {/* File name */}
          <Field label={t.fileName}>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="
                w-full px-3 py-2 rounded-[--radius-md]
                bg-surface-sunken border border-border
                text-[13px] text-text-primary
                placeholder:text-text-placeholder
                outline-none focus:border-accent/30 focus:shadow-[0_0_0_3px_rgba(232,101,74,0.06)]
                transition-all duration-150
              "
            />
          </Field>

          {/* Save to */}
          <Field label={t.saveTo}>
            <button
              onClick={handleSelectFolder}
              className="
                w-full flex items-center gap-2.5 px-3 py-2 rounded-[--radius-md]
                bg-surface-sunken border border-border
                text-[13px] text-text-secondary text-left
                hover:bg-surface-hover transition-colors duration-150 cursor-pointer
              "
            >
              <Folder className="w-4 h-4 text-text-tertiary flex-shrink-0" />
              <span className="truncate flex-1">{saveDir || t.selectFolder}</span>
            </button>
          </Field>

          {/* Format row */}
          <div className="grid grid-cols-3 gap-3">
            <Field label={t.fileType}>
              <Dropdown
                value={fileType}
                onChange={setFileType}
                options={FILE_TYPE_OPTIONS}
              />
            </Field>

            {!isAudioOnly && (
              <Field label={t.videoQuality}>
                <Dropdown
                  value={videoFormat}
                  onChange={setVideoFormat}
                  options={videoFormatOptions}
                  maxHeight={320}
                />
              </Field>
            )}

            <Field label={t.audioQuality}>
              <Dropdown
                value={audioFormat}
                onChange={setAudioFormat}
                options={audioFormatOptions}
                maxHeight={320}
              />
            </Field>
          </div>

          {/* Subtitles */}
          {parsedVideo.subtitles.length > 0 && (
            <Field label={
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                {t.subtitles}
                <span className="text-text-placeholder font-normal">
                  ({parsedVideo.subtitles.length})
                </span>
              </span>
            }>
              <div
                ref={subtitleContainerRef}
                className="
                  max-h-[30vh] min-h-[80px] overflow-y-auto
                  rounded-[--radius-md] border border-border
                  bg-surface-sunken
                "
              >
                {parsedVideo.subtitles.map((sub) => (
                  <SubtitleItem
                    key={sub.language}
                    subtitle={sub}
                    selected={selectedSubs.includes(sub.language)}
                    onToggle={() => handleToggleSub(sub.language)}
                    autoLabel={t.autoSubtitle}
                    manualLabel={t.manualSubtitle}
                  />
                ))}
              </div>
            </Field>
          )}

          {/* Subtitle format — only when subtitles are selected */}
          {selectedSubs.length > 0 && (
            <Field label={t.subtitleFormat}>
              <Dropdown
                value={subtitleFormat}
                onChange={setSubtitleFormat}
                options={SUBTITLE_FORMAT_OPTIONS}
                compact
              />
            </Field>
          )}
        </div>

        {/* Download button */}
        <div className="p-5 pt-3 border-t border-border-subtle">
          <motion.button
            whileHover={{ scale: 1.005 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDownload}
            className="
              w-full py-3 rounded-[--radius-md]
              bg-accent text-white text-[14px] font-semibold
              hover:bg-accent-hover
              shadow-[0_2px_8px_rgba(232,101,74,0.2)]
              transition-colors duration-150
              flex items-center justify-center gap-2
              cursor-pointer
            "
          >
            <Download className="w-4 h-4" />
            {t.download}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

// ── Sub-components ───────────────────────────────────────────

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-text-tertiary uppercase tracking-wide mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}

function SubtitleItem({
  subtitle,
  selected,
  onToggle,
  autoLabel,
  manualLabel,
}: {
  subtitle: SubtitleTrack
  selected: boolean
  onToggle: () => void
  autoLabel: string
  manualLabel: string
}) {
  return (
    <button
      onClick={onToggle}
      data-lang={subtitle.language}
      className={`
        w-full flex items-center gap-3 px-3 py-2
        text-left text-[13px]
        transition-colors duration-100
        cursor-pointer
        border-b border-border-subtle last:border-b-0
        ${selected ? 'bg-accent-soft text-text-primary' : 'text-text-secondary hover:bg-surface-hover'}
      `}
    >
      <div className={`
        w-4 h-4 rounded-[3px] border-2 flex items-center justify-center flex-shrink-0
        transition-all duration-150
        ${selected ? 'bg-accent border-accent' : 'border-border'}
      `}>
        {selected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
      </div>
      <span className="flex-1 truncate">{subtitle.languageName}</span>
      <span className={`
        text-[10px] px-1.5 py-0.5 rounded-[--radius-sm] font-medium
        ${subtitle.isAutomatic
          ? 'bg-surface-sunken text-text-placeholder'
          : 'bg-success-soft text-success'
        }
      `}>
        {subtitle.isAutomatic ? autoLabel : manualLabel}
      </span>
    </button>
  )
}

// ── Helpers ──────────────────────────────────────────────────

// Language codes matching each app language setting
const LANG_CODES: Record<string, string[]> = {
  en: ['en', 'en-US', 'en-GB', 'en-CA', 'en-AU'],
  zh: ['zh', 'zh-Hans', 'zh-Hant', 'zh-CN', 'zh-TW', 'zh-HK'],
  ja: ['ja'],
  ko: ['ko'],
  es: ['es', 'es-419', 'es-US', 'es-ES'],
  fr: ['fr', 'fr-CA', 'fr-FR'],
  de: ['de'],
}

function pickBestSubtitle(subtitles: SubtitleTrack[], appLang: string): string | null {
  const tryFind = (codes: string[]) => {
    // Manual subtitles take priority
    for (const code of codes) {
      const s = subtitles.find((x) => x.language === code && !x.isAutomatic)
      if (s) return s.language
    }
    // Then automatic
    for (const code of codes) {
      const s = subtitles.find((x) => x.language === code)
      if (s) return s.language
    }
    return null
  }

  const targetCodes = LANG_CODES[appLang] ?? LANG_CODES['en']
  const found = tryFind(targetCodes)
  if (found) return found

  // Fall back to English if app language wasn't English
  if (appLang !== 'en') return tryFind(LANG_CODES['en'])
  return null
}

function codecShort(codec: string): string {
  if (!codec || codec === 'none') return ''
  if (codec.startsWith('avc1') || codec.startsWith('h264')) return 'H.264'
  if (codec.startsWith('hev1') || codec.startsWith('hvc1')) return 'H.265'
  if (codec.startsWith('vp9') || codec.startsWith('vp09')) return 'VP9'
  if (codec.startsWith('av01')) return 'AV1'
  if (codec.startsWith('mp4a') || codec.startsWith('aac')) return 'AAC'
  if (codec.startsWith('opus')) return 'Opus'
  return codec.split('.')[0].toUpperCase()
}

function fmtSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}GB`
}

function sanitizeFileName(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '_').trim()
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}
