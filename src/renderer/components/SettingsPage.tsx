import { motion } from 'framer-motion'
import { ArrowLeft, Folder, Trash2, Coffee } from 'lucide-react'
import { Dropdown } from './Dropdown'
import { useAppStore } from '../stores/appStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useDownloadStore } from '../stores/downloadStore'

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
  { value: 'worst', label: 'Worst quality' },
  { value: '2160p', label: '2160p (4K)' },
  { value: '1440p', label: '1440p (2K)' },
  { value: '1080p', label: '1080p (Full HD)' },
  { value: '720p', label: '720p (HD)' },
  { value: '480p', label: '480p' },
  { value: '360p', label: '360p' },
]
const AUDIO_FORMAT_OPTIONS = [
  { value: 'best', label: 'Best quality' },
  { value: 'worst', label: 'Worst quality' },
]
const SUBTITLE_FORMAT_OPTIONS = [
  { value: 'original', label: 'Original', sublabel: 'Keep as downloaded' },
  { value: 'srt', label: 'SRT', sublabel: 'Most compatible' },
  { value: 'vtt', label: 'VTT', sublabel: 'Web standard' },
  { value: 'ass', label: 'ASS', sublabel: 'Advanced styling' },
  { value: 'lrc', label: 'LRC', sublabel: 'Lyrics format' },
]
const BROWSER_OPTIONS = [
  { value: 'chrome', label: 'Chrome' },
  { value: 'edge', label: 'Edge' },
  { value: 'firefox', label: 'Firefox' },
  { value: 'brave', label: 'Brave' },
]
const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'zh', label: '中文' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
]

export function SettingsPage() {
  const { setView } = useAppStore()
  const { settings, updateSettings } = useSettingsStore()
  const { clearCompleted } = useDownloadStore()

  const handleSelectFolder = async () => {
    const selected = await window.electronAPI.selectFolder(settings.downloadDir)
    if (selected) updateSettings({ downloadDir: selected })
  }

  return (
    <motion.main
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex-1 h-full overflow-y-auto bg-surface"
    >
      <div className="max-w-[560px] mx-auto px-6 py-8">
        {/* Back button + title */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => setView('home')}
            className="
              p-2 rounded-[--radius-md]
              hover:bg-surface-hover
              transition-colors duration-150
              cursor-pointer
            "
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </button>
          <h1 className="text-[20px] font-semibold text-text-primary tracking-[-0.02em]">
            Settings
          </h1>
        </div>

        <div className="space-y-6">
          {/* Download directory */}
          <SettingRow label="Default download directory">
            <button
              onClick={handleSelectFolder}
              className="
                w-full flex items-center gap-2 px-3 py-2.5 rounded-[--radius-md]
                bg-surface-sunken border border-border
                text-[13px] text-text-secondary text-left
                hover:bg-surface-hover transition-colors duration-150
                cursor-pointer
              "
            >
              <Folder className="w-4 h-4 text-text-tertiary flex-shrink-0" />
              <span className="truncate flex-1">{settings.downloadDir || 'Not set'}</span>
            </button>
          </SettingRow>

          {/* Default file type */}
          <SettingRow label="Default file type">
            <Dropdown
              value={settings.defaultFileType}
              onChange={(v) => updateSettings({ defaultFileType: v })}
              options={FILE_TYPE_OPTIONS}
            />
          </SettingRow>

          {/* Default video format */}
          <SettingRow label="Default video quality">
            <Dropdown
              value={settings.defaultVideoFormat}
              onChange={(v) => updateSettings({ defaultVideoFormat: v })}
              options={VIDEO_FORMAT_OPTIONS}
            />
          </SettingRow>

          {/* Default audio format */}
          <SettingRow label="Default audio quality">
            <Dropdown
              value={settings.defaultAudioFormat}
              onChange={(v) => updateSettings({ defaultAudioFormat: v })}
              options={AUDIO_FORMAT_OPTIONS}
            />
          </SettingRow>

          {/* Default subtitle format */}
          <SettingRow label="Default subtitle format">
            <Dropdown
              value={settings.defaultSubtitleFormat || 'original'}
              onChange={(v) => updateSettings({ defaultSubtitleFormat: v })}
              options={SUBTITLE_FORMAT_OPTIONS}
            />
          </SettingRow>

          {/* Cookie browser */}
          <SettingRow
            label="Cookie browser"
            hint="Browser to extract cookies from for member-only videos"
          >
            <Dropdown
              value={settings.cookieBrowser}
              onChange={(v) => updateSettings({ cookieBrowser: v })}
              options={BROWSER_OPTIONS}
            />
          </SettingRow>

          {/* Language */}
          <SettingRow label="Language">
            <Dropdown
              value={settings.language}
              onChange={(v) => updateSettings({ language: v })}
              options={LANGUAGE_OPTIONS}
            />
          </SettingRow>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Clear history */}
          <SettingRow label="Download history" hint="Remove completed downloads from the sidebar">
            <button
              onClick={clearCompleted}
              className="
                flex items-center gap-2 px-4 py-2.5 rounded-[--radius-md]
                border border-border
                text-[13px] text-text-secondary font-medium
                hover:bg-error-soft hover:border-error/20 hover:text-error
                transition-all duration-150
                cursor-pointer
              "
            >
              <Trash2 className="w-4 h-4" />
              Clear completed
            </button>
          </SettingRow>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Support development */}
          <div className="rounded-[--radius-lg] bg-accent-soft border border-accent/10 p-5">
            <div className="flex items-start gap-4">
              <div className="
                w-10 h-10 rounded-[--radius-md] flex-shrink-0
                bg-accent/10
                flex items-center justify-center
              ">
                <Coffee className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[13px] font-semibold text-text-primary mb-1">
                  Support development
                </h3>
                <p className="text-[12px] text-text-secondary leading-relaxed mb-3">
                  If you find YT Downloader useful, consider buying me a coffee. It helps me keep building!
                </p>
                <button
                  onClick={() => window.electronAPI.openExternal('https://buymeacoffee.com/georgettt')}
                  className="
                    flex items-center gap-2 px-4 py-2 rounded-[--radius-md]
                    bg-accent text-white
                    text-[12px] font-medium
                    hover:bg-accent-hover
                    transition-colors duration-150
                    cursor-pointer
                  "
                >
                  <Coffee className="w-3.5 h-3.5" />
                  Buy me a coffee
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.main>
  )
}

// ── Sub-components ───────────────────────────────────────────

function SettingRow({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-text-primary mb-1.5">
        {label}
      </label>
      {hint && (
        <p className="text-[11px] text-text-placeholder mb-2">{hint}</p>
      )}
      {children}
    </div>
  )
}

