import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Folder, Download, X, Check, ListVideo, Clock } from 'lucide-react'
import { Dropdown } from './Dropdown'
import { useAppStore } from '../stores/appStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useDownloadStore } from '../stores/downloadStore'
import type { DownloadOptions, DownloadTask, PlaylistEntry } from '../../shared/types'

const FILE_TYPE_OPTIONS = [
  { value: 'mp4', label: 'MP4', sublabel: 'Video — Most compatible' },
  { value: 'mkv', label: 'MKV', sublabel: 'Video — High quality container' },
  { value: 'webm', label: 'WebM', sublabel: 'Video — Web optimized' },
  { value: 'mp3', label: 'MP3', sublabel: 'Audio — Universal' },
  { value: 'm4a', label: 'M4A', sublabel: 'Audio — Apple / AAC' },
  { value: 'wav', label: 'WAV', sublabel: 'Audio — Lossless, large' },
]

const VIDEO_FORMAT_OPTIONS = [
  { value: 'best', label: 'Best quality' },
  { value: '2160p', label: '2160p (4K)' },
  { value: '1440p', label: '1440p (2K)' },
  { value: '1080p', label: '1080p (Full HD)' },
  { value: '720p', label: '720p (HD)' },
  { value: '480p', label: '480p' },
  { value: '360p', label: '360p' },
  { value: 'worst', label: 'Worst quality' },
]

const AUDIO_FORMAT_OPTIONS = [
  { value: 'best', label: 'Best quality' },
  { value: 'worst', label: 'Worst quality' },
]

const AUDIO_ONLY_TYPES = ['mp3', 'm4a', 'wav', 'aac', 'opus', 'flac']

export function PlaylistPanel() {
  const { parsedPlaylist, resetParse, useCookies } = useAppStore()
  const { settings } = useSettingsStore()
  const { addTask } = useDownloadStore()

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [saveDir, setSaveDir] = useState('')
  const [fileType, setFileType] = useState('mp4')
  const [videoFormat, setVideoFormat] = useState('best')
  const [audioFormat, setAudioFormat] = useState('best')

  useEffect(() => {
    if (parsedPlaylist) {
      // Select all entries by default
      setSelected(new Set(parsedPlaylist.entries.map((e) => e.id)))
    }
    setSaveDir(settings.downloadDir)
    setFileType(settings.defaultFileType)
    setVideoFormat(settings.defaultVideoFormat)
    setAudioFormat(settings.defaultAudioFormat)
  }, [parsedPlaylist, settings])

  if (!parsedPlaylist) return null

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
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(parsedPlaylist.entries.map((e) => e.id)))
    }
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
        saveDir,
        fileType,
        videoFormat: isAudioOnly ? 'best' : videoFormat,
        audioFormat,
        useCookies,
        cookieBrowser: settings.cookieBrowser,
        subtitleLangs: [],
        subtitleFormat: 'original',
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
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="
              w-10 h-10 rounded-[--radius-md] flex-shrink-0
              bg-accent-soft
              flex items-center justify-center
            ">
              <ListVideo className="w-5 h-5 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-text-primary truncate leading-snug">
                {parsedPlaylist.title}
              </p>
              <p className="text-[11px] text-text-tertiary mt-0.5">
                {parsedPlaylist.entryCount} videos
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
            {allSelected ? 'Deselect all' : 'Select all'}
            <span className="ml-auto text-text-placeholder">
              {selected.size} / {parsedPlaylist.entries.length}
            </span>
          </button>

          {/* Scrollable entries */}
          <div className="max-h-[280px] overflow-y-auto">
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
          {/* Save to */}
          <Field label="Save to">
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
              <span className="truncate flex-1">{saveDir || 'Select folder...'}</span>
            </button>
          </Field>

          {/* Format row */}
          <div className={`grid gap-3 ${isAudioOnly ? 'grid-cols-2' : 'grid-cols-3'}`}>
            <Field label="File type">
              <Dropdown
                value={fileType}
                onChange={setFileType}
                options={FILE_TYPE_OPTIONS}
              />
            </Field>

            {!isAudioOnly && (
              <Field label="Video quality">
                <Dropdown
                  value={videoFormat}
                  onChange={setVideoFormat}
                  options={VIDEO_FORMAT_OPTIONS}
                />
              </Field>
            )}

            <Field label="Audio quality">
              <Dropdown
                value={audioFormat}
                onChange={setAudioFormat}
                options={AUDIO_FORMAT_OPTIONS}
              />
            </Field>
          </div>
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
              shadow-[0_2px_8px_rgba(232,101,74,0.2)]
              transition-colors duration-150
              flex items-center justify-center gap-2
              ${noneSelected
                ? 'bg-surface-sunken text-text-placeholder cursor-not-allowed shadow-none'
                : 'bg-accent text-white hover:bg-accent-hover cursor-pointer'
              }
            `}
          >
            <Download className="w-4 h-4" />
            Download {selected.size} video{selected.size !== 1 ? 's' : ''}
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
