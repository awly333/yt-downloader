import { motion } from 'framer-motion'
import { Settings, Download, ArrowDown, Trash2, Info } from 'lucide-react'
import { DownloadList } from './DownloadList'
import { useAppStore } from '../stores/appStore'
import { useDownloadStore } from '../stores/downloadStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useTranslation } from '../i18n'

export function Sidebar() {
  const { setView, view, setShowAbout } = useAppStore()
  const { tasks, setPendingDelete, clearCompleted, clearCompletedAndFiles, cancelAndRemoveAllActive } = useDownloadStore()
  const { settings } = useSettingsStore()
  const t = useTranslation()

  const hasCompleted = tasks.some((t) => t.status === 'completed')
  const hasActive = tasks.some((t) => ['downloading', 'queued', 'merging'].includes(t.status))
  const hasTasks = tasks.length > 0

  const handleClearAll = () => {
    if (!hasTasks) return

    if (!hasCompleted && !hasActive) {
      // Only failed tasks — remove without dialog
      for (const t of tasks) useDownloadStore.getState().removeTask(t.id)
      return
    }

    if (hasActive && !hasCompleted) {
      // Only active tasks — cancel + remove + clean files, no dialog
      cancelAndRemoveAllActive()
      return
    }

    // Has completed tasks (possibly also active) — show dialog
    if (settings.skipDeleteConfirm) {
      clearCompletedAndFiles()
      if (hasActive) cancelAndRemoveAllActive()
    } else {
      setPendingDelete({ type: 'all', cancelActive: hasActive })
    }
  }

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="
        w-[280px] min-w-[280px] h-full
        bg-sidebar border-r border-border
        flex flex-col
      "
    >
      {/* Logo / App Name */}
      <div className="px-5 py-4 flex items-center gap-3">
        <div className="
          w-9 h-9 rounded-[--radius-lg]
          bg-gradient-to-br from-accent to-[#E88A54]
          flex items-center justify-center
          shadow-sm
        ">
          <ArrowDown className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-[15px] font-semibold text-text-primary leading-tight tracking-[-0.01em]">
            YT Downloader
          </h1>
          <p className="text-[11px] text-text-tertiary leading-tight mt-0.5">
            {t.appSubtitle}
          </p>
        </div>
      </div>

      {/* Downloads section header */}
      <div className="px-5 pt-4 pb-2 flex items-center gap-2">
        <Download className="w-3.5 h-3.5 text-text-tertiary" />
        <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-widest flex-1">
          {t.downloads}
        </span>
        {/* Clear all button */}
        {hasTasks && (
          <button
            onClick={handleClearAll}
            title={t.clearAll}
            className="
              p-1 rounded-[--radius-sm]
              text-text-placeholder
              hover:bg-error-soft hover:text-error
              transition-colors duration-150
              cursor-pointer
            "
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Downloads list */}
      <div className="flex-1 overflow-y-auto px-2">
        <DownloadList />
      </div>

      {/* Settings / About footer */}
      <div className="p-3 border-t border-border-subtle flex items-center gap-1.5">
        <button
          onClick={() => setView(view === 'settings' ? 'home' : 'settings')}
          className={`
            flex-1 flex items-center gap-3 px-3 py-2.5
            rounded-[--radius-md]
            text-[13px] font-medium
            transition-colors duration-150 ease-out
            cursor-pointer
            ${view === 'settings'
              ? 'bg-surface-hover text-text-primary'
              : 'text-text-secondary hover:bg-surface-hover'
            }
          `}
        >
          <Settings className="w-4 h-4" />
          {t.settings}
        </button>
        <button
          onClick={() => setShowAbout(true)}
          title={t.settings}
          className="
            p-2.5 rounded-[--radius-md]
            text-text-tertiary
            hover:bg-surface-hover hover:text-text-secondary
            transition-colors duration-150
            cursor-pointer
          "
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
    </motion.aside>
  )
}
