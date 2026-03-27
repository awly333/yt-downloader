import { motion } from 'framer-motion'
import { Settings, Download, ArrowDown, Trash2, Info } from 'lucide-react'
import { DownloadList } from './DownloadList'
import { useAppStore } from '../stores/appStore'
import { useDownloadStore } from '../stores/downloadStore'
import { useSettingsStore } from '../stores/settingsStore'

export function Sidebar() {
  const { setView, view, setShowAbout } = useAppStore()
  const { tasks, setPendingDelete, clearCompleted, clearCompletedAndFiles } = useDownloadStore()
  const { settings } = useSettingsStore()

  const hasCompleted = tasks.some((t) => t.status === 'completed')
  const hasTasks = tasks.length > 0

  const handleClearAll = () => {
    if (!hasTasks) return

    if (hasCompleted) {
      if (settings.skipDeleteConfirm) {
        clearCompletedAndFiles()
      } else {
        setPendingDelete({ type: 'all' })
      }
    } else {
      // No completed tasks — just remove failed/other non-active items
      const nonActive = tasks.filter(
        (t) => t.status !== 'downloading' && t.status !== 'queued' && t.status !== 'merging'
      )
      for (const t of nonActive) {
        useDownloadStore.getState().removeTask(t.id)
      }
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
            Video downloader
          </p>
        </div>
      </div>

      {/* Downloads section header */}
      <div className="px-5 pt-4 pb-2 flex items-center gap-2">
        <Download className="w-3.5 h-3.5 text-text-tertiary" />
        <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-widest flex-1">
          Downloads
        </span>
        {/* Clear all button */}
        {hasTasks && (
          <button
            onClick={handleClearAll}
            title="Clear all"
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
          Settings
        </button>
        <button
          onClick={() => setShowAbout(true)}
          title="About"
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
