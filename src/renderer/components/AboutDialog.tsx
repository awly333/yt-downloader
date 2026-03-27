import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowDown, GitBranch, ExternalLink, Heart } from 'lucide-react'
import { useAppStore } from '../stores/appStore'

export function AboutDialog() {
  const { showAbout, setShowAbout } = useAppStore()
  const [version, setVersion] = useState<string>('')
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (showAbout) {
      window.electronAPI.getAppVersion().then(setVersion)
      // Focus the close button when dialog opens
      setTimeout(() => closeButtonRef.current?.focus(), 50)
    }
  }, [showAbout])

  // Escape to close
  useEffect(() => {
    if (!showAbout) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowAbout(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [showAbout, setShowAbout])

  return (
    <AnimatePresence>
      {showAbout && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center"
          onClick={() => setShowAbout(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            onClick={(e) => e.stopPropagation()}
            className="
              relative w-[300px]
              bg-surface-raised
              rounded-[--radius-lg]
              border border-border
              shadow-[0_16px_48px_rgba(0,0,0,0.12),0_4px_16px_rgba(0,0,0,0.06)]
              overflow-hidden
            "
          >
            {/* Close button */}
            <button
              ref={closeButtonRef}
              onClick={() => setShowAbout(false)}
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
            <div className="flex flex-col items-center px-7 pt-8 pb-7 text-center">
              {/* App icon */}
              <div className="
                w-[60px] h-[60px] rounded-[--radius-xl]
                bg-gradient-to-br from-accent to-[#E88A54]
                flex items-center justify-center
                shadow-[0_4px_20px_rgba(232,101,74,0.3)]
                mb-4
              ">
                <ArrowDown className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>

              <h2 className="text-[16px] font-semibold text-text-primary tracking-[-0.01em]">
                YT Downloader
              </h2>
              {version && (
                <p className="text-[12px] text-text-placeholder mt-0.5 mb-4">
                  Version {version}
                </p>
              )}

              <p className="text-[12px] text-text-secondary leading-relaxed mb-5">
                A beautiful video downloader powered by yt-dlp.
                <br />
                Supports YouTube, Bilibili, Twitter, and 1000+ sites.
              </p>

              {/* Links */}
              <div className="flex flex-col gap-2 w-full">
                <button
                  onClick={() => window.electronAPI.openExternal('https://github.com/awly333/yt-downloader')}
                  className="
                    flex items-center justify-center gap-2
                    px-4 py-2 rounded-[--radius-md]
                    border border-border
                    text-[12px] text-text-secondary
                    hover:bg-surface-hover
                    transition-colors duration-150
                    cursor-pointer
                  "
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  View on GitHub
                  <ExternalLink className="w-3 h-3 text-text-placeholder" />
                </button>

                <button
                  onClick={() => window.electronAPI.openExternal('https://buymeacoffee.com/georgettt')}
                  className="
                    flex items-center justify-center gap-2
                    px-4 py-2 rounded-[--radius-md]
                    bg-accent-soft border border-accent/15
                    text-[12px] text-accent font-medium
                    hover:bg-accent/10
                    transition-colors duration-150
                    cursor-pointer
                  "
                >
                  <Heart className="w-3.5 h-3.5" />
                  Support development
                </button>
              </div>

              {/* Credits */}
              <p className="text-[11px] text-text-placeholder mt-5">
                Powered by{' '}
                <button
                  onClick={() => window.electronAPI.openExternal('https://github.com/yt-dlp/yt-dlp')}
                  className="text-text-tertiary hover:text-text-secondary underline cursor-pointer transition-colors"
                >
                  yt-dlp
                </button>
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
