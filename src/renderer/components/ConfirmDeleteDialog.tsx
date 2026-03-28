import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'
import { useDownloadStore, type PendingDelete } from '../stores/downloadStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useTranslation } from '../i18n'

export function ConfirmDeleteDialog() {
  const { pendingDelete, setPendingDelete, removeTask, removeTaskAndFile, clearCompleted, clearCompletedAndFiles, cancelAndRemoveAllActive } = useDownloadStore()
  const { settings, updateSettings } = useSettingsStore()
  const t = useTranslation()
  const [dontAskAgain, setDontAskAgain] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  // Escape to close
  useEffect(() => {
    if (!pendingDelete) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPendingDelete(null)
        setDontAskAgain(false)
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [pendingDelete, setPendingDelete])

  // Focus first button when dialog opens
  useEffect(() => {
    if (!pendingDelete) return
    const firstButton = dialogRef.current?.querySelector<HTMLElement>('button')
    firstButton?.focus()
  }, [pendingDelete])

  const isSingle = pendingDelete?.type === 'single'
  const title = isSingle ? t.removeDownloadTitle : t.clearAllCompletedTitle
  const description = isSingle ? t.removeDialogDescSingle : t.removeDialogDescAll

  const handleListOnly = async () => {
    if (!pendingDelete) return
    if (pendingDelete.type === 'single') {
      removeTask(pendingDelete.taskId)
    } else {
      clearCompleted()
      // Active tasks always get cancelled + cleaned regardless of dialog choice
      if (pendingDelete.cancelActive) await cancelAndRemoveAllActive()
    }
    if (dontAskAgain) {
      updateSettings({ skipDeleteConfirm: true })
    }
    setPendingDelete(null)
    setDontAskAgain(false)
  }

  const handleDeleteFiles = async () => {
    if (!pendingDelete) return
    if (pendingDelete.type === 'single') {
      await removeTaskAndFile(pendingDelete.taskId)
    } else {
      await clearCompletedAndFiles()
      // Active tasks always get cancelled + cleaned regardless of dialog choice
      if (pendingDelete.cancelActive) await cancelAndRemoveAllActive()
    }
    if (dontAskAgain) {
      updateSettings({ skipDeleteConfirm: true })
    }
    setPendingDelete(null)
    setDontAskAgain(false)
  }

  const handleClose = () => {
    setPendingDelete(null)
    setDontAskAgain(false)
  }

  return (
    <AnimatePresence>
      {pendingDelete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center"
          onClick={handleClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            ref={dialogRef}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key !== 'Tab') return
              const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
                'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
              )
              if (!focusable || focusable.length === 0) return
              const first = focusable[0]
              const last = focusable[focusable.length - 1]
              if (e.shiftKey && document.activeElement === first) {
                e.preventDefault()
                last.focus()
              } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault()
                first.focus()
              }
            }}
            className="
              relative w-[380px]
              bg-surface-raised
              rounded-[--radius-lg]
              border border-border
              shadow-[0_16px_48px_rgba(0,0,0,0.12),0_4px_16px_rgba(0,0,0,0.06)]
              overflow-hidden
            "
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="
                absolute top-3 right-3
                p-1.5 rounded-[--radius-sm]
                text-text-tertiary
                hover:bg-surface-hover hover:text-text-primary
                transition-colors duration-100
                cursor-pointer
              "
            >
              <X className="w-4 h-4" />
            </button>

            {/* Content */}
            <div className="p-5 pb-4">
              <div className="flex items-start gap-3">
                <div className="
                  w-9 h-9 rounded-full flex-shrink-0
                  bg-warning/10
                  flex items-center justify-center
                ">
                  <AlertTriangle className="w-4.5 h-4.5 text-warning" />
                </div>
                <div className="pt-0.5">
                  <h3 className="text-[14px] font-semibold text-text-primary">
                    {title}
                  </h3>
                  <p className="text-[12px] text-text-tertiary mt-1 leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>

              {/* Don't ask again checkbox */}
              <div className="flex items-center gap-2.5 mt-4 ml-12">
                <button
                  onClick={() => setDontAskAgain(!dontAskAgain)}
                  className={`
                    w-[16px] h-[16px] rounded-[3px] border-2 flex items-center justify-center
                    flex-shrink-0 transition-all duration-150 cursor-pointer
                    ${dontAskAgain ? 'bg-accent border-accent' : 'border-border hover:border-text-tertiary'}
                  `}
                >
                  {dontAskAgain && (
                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="2 6 5 9 10 3" />
                    </svg>
                  )}
                </button>
                <span className="text-[11px] text-text-secondary">
                  {t.dontAskAgain}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 px-5 pb-5">
              <button
                onClick={handleListOnly}
                className="
                  flex-1 py-2.5 rounded-[--radius-md]
                  border border-border
                  text-[13px] font-medium text-text-secondary
                  hover:bg-surface-hover
                  transition-colors duration-150
                  cursor-pointer
                "
              >
                {t.removeFromList}
              </button>
              <button
                onClick={handleDeleteFiles}
                className="
                  flex-1 py-2.5 rounded-[--radius-md]
                  bg-error text-white
                  text-[13px] font-medium
                  hover:bg-error/90
                  transition-colors duration-150
                  cursor-pointer
                "
              >
                {t.deleteFilesToo}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
