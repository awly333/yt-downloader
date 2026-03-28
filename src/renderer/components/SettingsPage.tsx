import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Folder, Trash2, Coffee, FolderOpen, TriangleAlert } from 'lucide-react'
import { Dropdown } from './Dropdown'
import { useAppStore } from '../stores/appStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useDownloadStore } from '../stores/downloadStore'
import { useTranslation } from '../i18n'

const BROWSER_OPTIONS = [
  { value: 'chrome', label: 'Chrome' },
  { value: 'edge', label: 'Edge' },
  { value: 'firefox', label: 'Firefox' },
  { value: 'brave', label: 'Brave' },
  { value: 'local', label: 'Local' },
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
  const t = useTranslation()
  const [cookiesDir, setCookiesDir] = useState('')
  const [uninstallConfirm, setUninstallConfirm] = useState(false)
  const [uninstalling, setUninstalling] = useState(false)

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
    { value: 'worst', label: t.worstQuality },
    { value: '2160p', label: '2160p (4K)' },
    { value: '1440p', label: '1440p (2K)' },
    { value: '1080p', label: '1080p (Full HD)' },
    { value: '720p', label: '720p (HD)' },
    { value: '480p', label: '480p' },
    { value: '360p', label: '360p' },
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
  const BANDWIDTH_OPTIONS = [
    { value: 'unlimited', label: 'Unlimited', sublabel: t.bwNoLimit },
    { value: '512k', label: '512 KB/s' },
    { value: '1m', label: '1 MB/s' },
    { value: '2m', label: '2 MB/s' },
    { value: '5m', label: '5 MB/s' },
    { value: '10m', label: '10 MB/s' },
  ]

  useEffect(() => {
    window.electronAPI.getCookiesDir().then(setCookiesDir)
  }, [])

  const handleSelectFolder = async () => {
    const selected = await window.electronAPI.selectFolder(settings.downloadDir)
    if (selected) updateSettings({ downloadDir: selected })
  }

  const handleOpenCookiesDir = () => {
    if (cookiesDir) window.electronAPI.openFile(cookiesDir)
  }

  const handleUninstall = async () => {
    setUninstalling(true)
    await window.electronAPI.uninstallApp()
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
            {t.settingsTitle}
          </h1>
        </div>

        <div className="space-y-6">
          {/* Download directory */}
          <SettingRow label={t.settingDownloadDir}>
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
          <SettingRow label={t.settingDefaultFileType}>
            <Dropdown
              value={settings.defaultFileType}
              onChange={(v) => updateSettings({ defaultFileType: v })}
              options={FILE_TYPE_OPTIONS}
            />
          </SettingRow>

          {/* Default video format */}
          <SettingRow label={t.settingDefaultVideoQuality}>
            <Dropdown
              value={settings.defaultVideoFormat}
              onChange={(v) => updateSettings({ defaultVideoFormat: v })}
              options={VIDEO_FORMAT_OPTIONS}
            />
          </SettingRow>

          {/* Default audio format */}
          <SettingRow label={t.settingDefaultAudioQuality}>
            <Dropdown
              value={settings.defaultAudioFormat}
              onChange={(v) => updateSettings({ defaultAudioFormat: v })}
              options={AUDIO_FORMAT_OPTIONS}
            />
          </SettingRow>

          {/* Default subtitle format */}
          <SettingRow label={t.settingDefaultSubtitleFormat}>
            <Dropdown
              value={settings.defaultSubtitleFormat || 'original'}
              onChange={(v) => updateSettings({ defaultSubtitleFormat: v })}
              options={SUBTITLE_FORMAT_OPTIONS}
            />
          </SettingRow>

          {/* Bandwidth limit */}
          <SettingRow
            label={t.settingSpeedLimit}
            hint={t.settingSpeedLimitHint}
          >
            <Dropdown
              value={settings.bandwidthLimit || 'unlimited'}
              onChange={(v) => updateSettings({ bandwidthLimit: v })}
              options={BANDWIDTH_OPTIONS}
            />
          </SettingRow>

          {/* Cookie browser */}
          <SettingRow
            label={t.settingCookieBrowser}
            hint={t.settingCookieBrowserHint}
          >
            <Dropdown
              value={settings.cookieBrowser}
              onChange={(v) => updateSettings({ cookieBrowser: v })}
              options={BROWSER_OPTIONS}
            />
            {settings.cookieBrowser === 'local' && cookiesDir && (
              <button
                onClick={handleOpenCookiesDir}
                className="
                  mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-[--radius-md]
                  bg-surface-sunken border border-border
                  text-[12px] text-text-secondary text-left
                  hover:bg-surface-hover transition-colors duration-150 cursor-pointer
                "
              >
                <FolderOpen className="w-3.5 h-3.5 text-text-tertiary flex-shrink-0" />
                <span className="truncate flex-1">{cookiesDir}</span>
              </button>
            )}
          </SettingRow>

          {/* Language */}
          <SettingRow label={t.settingLanguage}>
            <Dropdown
              value={settings.language}
              onChange={(v) => updateSettings({ language: v })}
              options={LANGUAGE_OPTIONS}
            />
          </SettingRow>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Clear history */}
          <SettingRow label={t.settingHistory} hint={t.settingHistoryHint}>
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
              {t.clearCompleted}
            </button>
          </SettingRow>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Uninstall */}
          <div>
            <label className="block text-[13px] font-medium text-text-primary mb-1.5">
              {t.settingUninstall}
            </label>
            <p className="text-[11px] text-text-placeholder mb-3">
              {t.settingUninstallDesc}
            </p>

            <AnimatePresence mode="wait" initial={false}>
              {!uninstallConfirm ? (
                <motion.button
                  key="trigger"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => setUninstallConfirm(true)}
                  className="
                    flex items-center gap-2 px-4 py-2.5 rounded-[--radius-md]
                    border border-border
                    text-[13px] text-text-secondary font-medium
                    hover:bg-error-soft hover:border-error/20 hover:text-error
                    transition-all duration-150 cursor-pointer
                  "
                >
                  <Trash2 className="w-4 h-4" />
                  {t.uninstallButton}
                </motion.button>
              ) : (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="rounded-[--radius-lg] border border-error/20 bg-error-soft p-4"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-7 h-7 rounded-full bg-error/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <TriangleAlert className="w-3.5 h-3.5 text-error" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-text-primary mb-1">
                        {t.uninstallConfirmTitle}
                      </p>
                      <p className="text-[12px] text-text-secondary leading-relaxed">
                        {t.uninstallConfirmDesc}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => setUninstallConfirm(false)}
                      disabled={uninstalling}
                      className="
                        px-3.5 py-2 rounded-[--radius-md]
                        text-[12px] font-medium text-text-secondary
                        hover:bg-surface-hover
                        transition-colors duration-150 cursor-pointer
                        disabled:opacity-40
                      "
                    >
                      {t.cancel}
                    </button>
                    <button
                      onClick={handleUninstall}
                      disabled={uninstalling}
                      className="
                        flex items-center gap-1.5 px-3.5 py-2 rounded-[--radius-md]
                        bg-error text-white
                        text-[12px] font-medium
                        hover:opacity-90
                        transition-opacity duration-150 cursor-pointer
                        disabled:opacity-60
                      "
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {uninstalling ? t.uninstalling : t.confirmUninstall}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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
                  {t.supportTitle}
                </h3>
                <p className="text-[12px] text-text-secondary leading-relaxed mb-3">
                  {t.supportDesc}
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
                  {t.buyMeCoffee}
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

