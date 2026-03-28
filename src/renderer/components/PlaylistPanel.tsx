import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Folder, Download, X, Check, ListVideo, Clock, Globe, List } from 'lucide-react'
import { Dropdown } from './Dropdown'
import { useAppStore } from '../stores/appStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useDownloadStore } from '../stores/downloadStore'
import type { DownloadOptions, DownloadTask, PlaylistEntry } from '../../shared/types'
import { useTranslation } from '../i18n'

// Common subtitle languages to offer for playlist downloads
const SUBTITLE_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'zh-Hans', label: '简体中文' },
  { code: 'zh-Hant', label: '繁體中文' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pt', label: 'Português' },
  { code: 'ru', label: 'Русский' },
  { code: 'ar', label: 'العربية' },
  { code: 'hi', label: 'हिन्दी' },
]

const AUDIO_ONLY_TYPES = ['mp3', 'm4a', 'wav', 'aac', 'opus', 'flac']

export function PlaylistPanel() {
  const { parsedPlaylist, resetParse, useCookies } = useAppStore()
  const { settings } = useSettingsStore()
  const { addTask } = useDownloadStore()
  const t = useTranslation()

  const FILE_TYPE_OPTIONS = [
    { value: 'mp4', label: 'MP4', sublabel: t.ftVideoCompatible },
    { value: 'mkv', label: 'MKV', sublabel: t.ftVideoHighQuality },
    { value: 'webm', label: 'WebM', sublabel: t.ftVideoWebOptimized },
    { value: 'mp3', label: 'MP3', sublabel: t.ftAudioUniversal },
    { value: 'm4a', label: 'M4A', sublabel: t.ftAudioAac },
    { value: 'wav', label: 'WAV', sublabel: t.ftAudioLosslessLarge },
  ]

  const VIDEO_FORMAT_OPTIONS = [
    { value: 'best', label: t.bestQuality },
    { value: '2160p', label: '2160p (4K)' },
    { value: '1440p', label: '1440p (2K)' },
    { value: '1080p', label: '1080p (Full HD)' },
    { value: '720p', label: '720p (HD)' },
    { value: '480p', label: '480p' },
    { value: '360p', label: '360p' },
    { value: 'worst', label: t.worstQuality },
  ]

  const AUDIO_FORMAT_OPTIONS = [
    { value: 'best', label: t.bestQuality },
    { value: 'worst', label: t.worstQuality },
  ]

  const SUBTITLE_FORMAT_OPTIONS = [
    { value: 'original', label: 'Original', sublabel: t.sfKeepAsDownloaded },
    { value: 'srt', label: 'SRT', sublabel: t.sfMostCompatible },
    { value: 'vtt', label: 'VTT', sublabel: t.sfWebStandard },
    { value: 'ass', label: 'ASS', sublabel: t.sfAdvancedStyling },
    { value: 'lrc', label: 'LRC', sublabel: t.sfLyricsFormat },
  ]

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [folderName, setFolderName] = useState('')
  const [saveDir, setSaveDir] = useState('')
  const [fileType, setFileType] = useState('mp4')
  const [videoFormat, setVideoFormat] = useState('best')
  const [audioFormat, setAudioFormat] = useState('best')
  const [selectedSubs, setSelectedSubs] = useState<string[]>([])
  const [subtitleFormat, setSubtitleFormat] = useState('original')
  const subtitleContainerRef = useRef<HTMLDivElement>(null)
  const autoSelectedPlaylistRef = useRef<string | null>(null)

  useEffect(() => {
    if (parsedPlaylist) {
      setSelected(new Set(parsedPlaylist.entries.map((e) => e.id)))
      setFolderName(sanitizeFileName(parsedPlaylist.title))
      // Auto-select subtitle language only when a new playlist is parsed
      if (autoSelectedPlaylistRef.current !== parsedPlaylist.url) {
        autoSelectedPlaylistRef.current = parsedPlaylist.url
        const defaultLang = pickDefaultSubLang(settings.language)
        setSelectedSubs(defaultLang ? [defaultLang] : [])
      }
    }
    setSaveDir(settings.downloadDir)
    setFileType(settings.defaultFileType)
    setVideoFormat(settings.defaultVideoFormat)
    setAudioFormat(settings.defaultAudioFormat)
    setSubtitleFormat(settings.defaultSubtitleFormat || 'original')
  }, [parsedPlaylist, settings])

  // Auto-scroll subtitle list to the pre-selected language
  useEffect(() => {
    if (selectedSubs.length === 0 || !subtitleContainerRef.current) return
    const lang = selectedSubs[0]
    const el = subtitleContainerRef.current.querySelector(`[data-lang="${lang}"]`)
    if (!el) return
    const timer = setTimeout(() => el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 300)
    return () => clearTimeout(timer)
  }, [selectedSubs])

  if (!parsedPlaylist) return null

  // Final download path: saveDir / folderName
  const finalDir = saveDir && folderName ? `${saveDir}/${folderName}` : saveDir || folderName

  const allSelected = selected.size === parsedPlaylist.entries.length
  const noneSelected = selected.size === 0
  const isAudioOnly = AUDIO_ONLY_TYPES.includes(fileType)

  const toggleEntry = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(parsedPlaylist.entries.map((e) => e.id)))
  }

  const toggleSub = (code: string) => {
    setSelectedSubs((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
  }

  const handleSelectFolder = async () => {
    const folder = await window.electronAPI.selectFolder(saveDir)
    if (folder) setSaveDir(folder)
  }

  const handleDownloadSelected = async () => {
    const entries = parsedPlaylist.entries.filter((e) => selected.has(e.id))
    if (entries.length === 0) return

    for (const entry of entries) {
      const options: DownloadOptions = {
        url: entry.url,
        fileName: sanitizeFileName(entry.title),
        saveDir: finalDir,
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
          thumbnail: '',
          status: 'downloading',
          progress: 0,
          speed: '',
          eta: '',
          filePath: null,
          error: null,
          createdAt: Date.now(),
        }
        addTask(task)
      } catch (err) {
        console.error('Failed to start download for:', entry.title, err)
      }
    }

    resetParse()
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
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-4 border-b border-border-subtle">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            {/* Thumbnail or fallback icon */}
            <div className="relative w-20 h-12 flex-shrink-0">
              {parsedPlaylist.thumbnail ? (
                <img
                  src={parsedPlaylist.thumbnail}
                  alt=""
                  className="w-20 h-12 rounded-[--radius-md] object-cover shadow-sm"
                />
              ) : (
                <div className="w-20 h-12 rounded-[--radius-md] bg-accent-soft flex items-center justify-center">
                  <ListVideo className="w-6 h-6 text-accent" />
                </div>
              )}
              {/* Playlist badge overlay */}
              <div className="
                absolute bottom-1 right-1
                bg-black/60 rounded-[3px] px-1 py-0.5
                flex items-center gap-0.5
              ">
                <List className="w-2.5 h-2.5 text-white" />
                <span className="text-[9px] text-white font-medium leading-none">
                  {parsedPlaylist.entryCount}
                </span>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-text-primary truncate leading-snug">
                {parsedPlaylist.title}
              </p>
              <p className="text-[11px] text-text-tertiary mt-1">
                {t.entryCount(parsedPlaylist.entryCount)}
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

        {/* Entry list */}
        <div className="border-b border-border-subtle">
          {/* Select all row */}
          <button
            onClick={toggleAll}
            className="
              w-full flex items-center gap-3 px-5 py-2.5
              text-left text-[12px] font-medium text-text-tertiary
              hover:bg-surface-hover transition-colors cursor-pointer
              border-b border-border-subtle
            "
          >
            <div className={`
              w-4 h-4 rounded-[3px] border-2 flex items-center justify-center flex-shrink-0
              transition-all duration-150
              ${allSelected ? 'bg-accent border-accent' : 'border-border'}
            `}>
              {allSelected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
            </div>
            {allSelected ? t.deselectAll : t.selectAll}
            <span className="ml-auto text-text-placeholder">
              {selected.size} / {parsedPlaylist.entries.length}
            </span>
          </button>

          {/* Scrollable entries */}
          <div className="max-h-[240px] overflow-y-auto">
            {parsedPlaylist.entries.map((entry, idx) => (
              <PlaylistEntryRow
                key={entry.id}
                entry={entry}
                index={idx + 1}
                selected={selected.has(entry.id)}
                onToggle={() => toggleEntry(entry.id)}
              />
            ))}
          </div>
        </div>

        {/* Download options */}
        <div className="p-5 space-y-4">
          {/* Folder name */}
          <Field label={t.folderName}>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
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
          <div className={`grid gap-3 ${isAudioOnly ? 'grid-cols-2' : 'grid-cols-3'}`}>
            <Field label={t.fileType}>
              <Dropdown value={fileType} onChange={setFileType} options={FILE_TYPE_OPTIONS} />
            </Field>
            {!isAudioOnly && (
              <Field label={t.videoQuality}>
                <Dropdown value={videoFormat} onChange={setVideoFormat} options={VIDEO_FORMAT_OPTIONS} />
              </Field>
            )}
            <Field label={t.audioQuality}>
              <Dropdown value={audioFormat} onChange={setAudioFormat} options={AUDIO_FORMAT_OPTIONS} />
            </Field>
          </div>

          {/* Subtitles */}
          <Field label={
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              {t.subtitles}
              <span className="text-text-placeholder font-normal">
                ({SUBTITLE_LANGUAGES.length})
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
              {SUBTITLE_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  data-lang={lang.code}
                  onClick={() => toggleSub(lang.code)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2
                    text-left text-[13px]
                    transition-colors duration-100 cursor-pointer
                    border-b border-border-subtle last:border-b-0
                    ${selectedSubs.includes(lang.code)
                      ? 'bg-accent-soft text-text-primary'
                      : 'text-text-secondary hover:bg-surface-hover'
                    }
                  `}
                >
                  <div className={`
                    w-4 h-4 rounded-[3px] border-2 flex items-center justify-center flex-shrink-0
                    transition-all duration-150
                    ${selectedSubs.includes(lang.code) ? 'bg-accent border-accent' : 'border-border'}
                  `}>
                    {selectedSubs.includes(lang.code) && (
                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                    )}
                  </div>
                  <span className="flex-1 truncate">{lang.label}</span>
                </button>
              ))}
            </div>
          </Field>

          {/* Subtitle format — only when subtitles selected */}
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
            whileHover={!noneSelected ? { scale: 1.005 } : undefined}
            whileTap={!noneSelected ? { scale: 0.98 } : undefined}
            onClick={handleDownloadSelected}
            disabled={noneSelected}
            className={`
              w-full py-3 rounded-[--radius-md]
              text-[14px] font-semibold
              transition-colors duration-150
              flex items-center justify-center gap-2
              ${noneSelected
                ? 'bg-surface-sunken text-text-placeholder cursor-not-allowed'
                : 'bg-accent text-white hover:bg-accent-hover shadow-[0_2px_8px_rgba(232,101,74,0.2)] cursor-pointer'
              }
            `}
          >
            <Download className="w-4 h-4" />
            {t.downloadN(selected.size)}
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

function PlaylistEntryRow({
  entry,
  index,
  selected,
  onToggle,
}: {
  entry: PlaylistEntry
  index: number
  selected: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className={`
        w-full flex items-center gap-3 px-5 py-2.5
        text-left text-[13px]
        transition-colors duration-100 cursor-pointer
        border-b border-border-subtle last:border-b-0
        ${selected ? 'bg-accent-soft' : 'hover:bg-surface-hover'}
      `}
    >
      <div className={`
        w-4 h-4 rounded-[3px] border-2 flex items-center justify-center flex-shrink-0
        transition-all duration-150
        ${selected ? 'bg-accent border-accent' : 'border-border'}
      `}>
        {selected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
      </div>

      <span className="text-[11px] text-text-placeholder w-6 text-right flex-shrink-0">
        {index}
      </span>

      <span className={`flex-1 truncate ${selected ? 'text-text-primary' : 'text-text-secondary'}`}>
        {entry.title}
      </span>

      {entry.duration > 0 && (
        <span className="flex items-center gap-1 text-[11px] text-text-placeholder flex-shrink-0">
          <Clock className="w-3 h-3" />
          {formatDuration(entry.duration)}
        </span>
      )}
    </button>
  )
}

// ── Helpers ──────────────────────────────────────────────────

// Map app language setting → best matching code in SUBTITLE_LANGUAGES
function pickDefaultSubLang(appLang: string): string | null {
  const map: Record<string, string> = {
    en: 'en',
    zh: 'zh-Hans',
    ja: 'ja',
    ko: 'ko',
    es: 'es',
    fr: 'fr',
    de: 'de',
  }
  return map[appLang] ?? 'en'
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
