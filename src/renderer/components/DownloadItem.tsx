import { motion } from 'framer-motion'
import {
  X, RotateCcw, FolderOpen, FileText,
  Check, AlertCircle, Loader2, Clock
} from 'lucide-react'
import type { DownloadTask } from '../../shared/types'
import { useDownloadStore } from '../stores/downloadStore'
import { useSettingsStore } from '../stores/settingsStore'

interface DownloadItemProps {
  task: DownloadTask
}

export function DownloadItem({ task }: DownloadItemProps) {
  const { removeTask, removeTaskAndFile, retryTask, setPendingDelete } = useDownloadStore()
  const { settings } = useSettingsStore()

  const handleOpenFile = () => {
    if (task.filePath) window.electronAPI.openFile(task.filePath)
  }

  const handleOpenFolder = () => {
    if (task.filePath) window.electronAPI.openFolder(task.filePath)
  }

  const handleCancel = () => {
    window.electronAPI.cancelDownload(task.id)
    removeTask(task.id)
  }

  const handleRetry = () => {
    retryTask(task.id)
  }

  const handleDelete = () => {
    if (task.status === 'failed') {
      removeTask(task.id)
    } else if (task.status === 'completed') {
      if (settings.skipDeleteConfirm) {
        removeTaskAndFile(task.id)
      } else {
        setPendingDelete({ type: 'single', taskId: task.id })
      }
    } else if (task.status === 'downloading' || task.status === 'queued') {
      handleCancel()
    }
  }

  const handleContextMenu = async (e: React.MouseEvent) => {
    e.preventDefault()
    const action = await window.electronAPI.showContextMenu(
      task.id, task.status, !!task.filePath
    )
    if (!action) return
    switch (action) {
      case 'open-file': handleOpenFile(); break
      case 'open-folder': handleOpenFolder(); break
      case 'retry': handleRetry(); break
      case 'cancel': handleCancel(); break
      case 'copy-url': navigator.clipboard.writeText(task.options.url); break
      case 'remove': removeTask(task.id); break
      case 'delete-file': handleDelete(); break
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      onContextMenu={handleContextMenu}
      className="
        group relative
        px-3 py-2.5 mx-1 mb-1
        rounded-[--radius-md]
        hover:bg-surface-hover
        transition-colors duration-150
      "
    >
      <div className="flex items-start gap-2.5">
        {/* Thumbnail */}
        <div className="w-10 h-7 rounded-[4px] bg-surface-sunken flex-shrink-0 overflow-hidden">
          {task.thumbnail ? (
            <img
              src={task.thumbnail}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FileText className="w-3 h-3 text-text-placeholder" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-medium text-text-primary truncate leading-tight">
            {task.options.fileName}
          </p>

          {/* Status line */}
          <div className="flex items-center gap-1.5 mt-1">
            <StatusIcon status={task.status} />
            <span className="text-[10px] text-text-tertiary">
              <StatusText task={task} />
            </span>
          </div>

          {/* Progress bar */}
          {(task.status === 'downloading' || task.status === 'merging') && (
            <div className="mt-1.5 w-full h-[3px] bg-surface-sunken rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${task.status === 'merging' ? 'bg-warning' : 'bg-accent'}`}
                initial={{ width: 0 }}
                animate={{ width: `${task.progress}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>
          )}
        </div>

        {/* Action buttons (visible on hover) */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          {task.status === 'completed' && (
            <>
              <ActionButton onClick={handleOpenFile} title="Open file">
                <FileText className="w-3 h-3" />
              </ActionButton>
              <ActionButton onClick={handleOpenFolder} title="Open folder">
                <FolderOpen className="w-3 h-3" />
              </ActionButton>
            </>
          )}
          {task.status === 'failed' && (
            <ActionButton onClick={handleRetry} title="Retry">
              <RotateCcw className="w-3 h-3" />
            </ActionButton>
          )}

          {/* Delete/remove — always visible on hover */}
          <ActionButton onClick={handleDelete} title="Remove" danger>
            <X className="w-3 h-3" />
          </ActionButton>
        </div>
      </div>
    </motion.div>
  )
}

// ── Sub-components ───────────────────────────────────────────

function StatusIcon({ status }: { status: DownloadTask['status'] }) {
  switch (status) {
    case 'queued':
      return <Clock className="w-3 h-3 text-text-placeholder" />
    case 'downloading':
      return (
        <Loader2 className="w-3 h-3 text-accent animate-spin" />
      )
    case 'merging':
      return (
        <Loader2 className="w-3 h-3 text-warning animate-spin" />
      )
    case 'completed':
      return <Check className="w-3 h-3 text-success" />
    case 'failed':
      return <AlertCircle className="w-3 h-3 text-error" />
  }
}

function StatusText({ task }: { task: DownloadTask }) {
  switch (task.status) {
    case 'queued':
      return 'Queued'
    case 'downloading':
      return (
        <>
          {Math.round(task.progress)}%
          {task.speed && ` · ${task.speed}`}
          {task.eta && task.eta !== 'Unknown' && ` · ${task.eta}`}
        </>
      )
    case 'merging':
      return 'Merging streams...'
    case 'completed':
      return 'Completed'
    case 'failed':
      return task.error || 'Failed'
  }
}

function ActionButton({
  onClick,
  title,
  children,
  danger,
}: {
  onClick: () => void
  title: string
  children: React.ReactNode
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`
        p-1.5 rounded-[--radius-sm]
        transition-colors duration-100
        cursor-pointer
        ${danger
          ? 'text-text-placeholder hover:bg-error-soft hover:text-error'
          : 'text-text-tertiary hover:bg-surface-sunken hover:text-text-primary'
        }
      `}
    >
      {children}
    </button>
  )
}
