import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { URLInput } from './URLInput'
import { OptionsPanel } from './OptionsPanel'
import { PlaylistPanel } from './PlaylistPanel'
import { ArrowDown, Link2 } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { useSettingsStore } from '../stores/settingsStore'

function ParseSkeleton() {
  const pulse = 'bg-surface-sunken rounded-[--radius-md] animate-pulse'
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.65, delay: 0.08, ease: [0, 0, 0.2, 1] } }}
      exit={{ opacity: 0, y: 8, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }}
      className="w-full mt-5"
    >
      <div className="bg-surface-raised rounded-[--radius-lg] border border-border shadow-[0_4px_24px_rgba(0,0,0,0.05)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3.5 p-5 pb-4 border-b border-border-subtle">
          <div className={`w-20 h-12 flex-shrink-0 ${pulse}`} style={{ animationDelay: '0ms' }} />
          <div className="flex-1 space-y-2 min-w-0">
            <div className={`h-3.5 w-4/5 ${pulse}`} style={{ animationDelay: '60ms' }} />
            <div className={`h-2.5 w-1/3 ${pulse}`} style={{ animationDelay: '120ms' }} />
          </div>
        </div>
        {/* Body */}
        <div className="p-5 space-y-4">
          <div className={`h-9 w-full ${pulse}`} style={{ animationDelay: '80ms' }} />
          <div className={`h-9 w-full ${pulse}`} style={{ animationDelay: '140ms' }} />
          <div className="grid grid-cols-3 gap-3">
            <div className={`h-9 ${pulse}`} style={{ animationDelay: '100ms' }} />
            <div className={`h-9 ${pulse}`} style={{ animationDelay: '160ms' }} />
            <div className={`h-9 ${pulse}`} style={{ animationDelay: '200ms' }} />
          </div>
          {/* Status hint */}
          <div className="flex items-center justify-center gap-2 py-1">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-accent/40"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
                />
              ))}
            </div>
            <span className="text-[12px] text-text-placeholder">Fetching video info…</span>
          </div>
        </div>
        {/* Footer */}
        <div className="p-5 pt-3 border-t border-border-subtle">
          <div className={`h-11 w-full ${pulse}`} style={{ animationDelay: '180ms' }} />
        </div>
      </div>
    </motion.div>
  )
}

function simplifyError(raw: string): string {
  if (raw.includes('Sign in to confirm') || raw.includes('not a bot')) {
    return 'YouTube requires sign-in. Enable "Use browser cookies" and try again.'
  }
  if ((raw.includes('Could not copy') || raw.includes('DPAPI') || raw.includes('Failed to decrypt')) && raw.includes('cookie')) {
    return 'Could not read browser cookies. Close the browser and try again.'
  }
  const match = raw.match(/Error:\s*(.+)$/s)
  return match ? match[1].trim() : raw
}

export function MainArea() {
  const { parsedVideo, parsedPlaylist, isParsing, setIsParsing, setParsedVideo, setParsedPlaylist, setParseError, useCookies } = useAppStore()
  const { settings } = useSettingsStore()
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current++
    if (dragCounter.current === 1) setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current--
    if (dragCounter.current <= 0) {
      dragCounter.current = 0
      setIsDragging(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragging(false)

    const text = (e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text/uri-list')).trim()
    if (!text || !text.startsWith('http') || isParsing) return

    setIsParsing(true)
    setParseError(null)
    try {
      const result = await window.electronAPI.parseUrl(text, useCookies, settings.cookieBrowser)
      if (result.type === 'playlist') {
        setParsedPlaylist(result.playlist)
      } else {
        setParsedVideo(result.video)
      }
    } catch (err: any) {
      setParseError(simplifyError(err.message || 'Failed to parse URL'))
    }
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="relative flex-1 h-full flex flex-col items-center overflow-y-auto bg-surface"
    >
      {/* Drag overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none"
          >
            <div className="absolute inset-3 rounded-[--radius-xl] border-2 border-dashed border-accent/40 bg-accent/[0.04]" />
            <div className="relative flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <Link2 className="w-5 h-5 text-accent" strokeWidth={2} />
              </div>
              <p className="text-[14px] font-medium text-accent">Drop URL to download</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right padding ensures content never goes under the window control buttons */}
      <motion.div
        layout="position"
        transition={{ layout: { duration: 1.1, ease: [0.22, 1, 0.36, 1] } }}
        className={`
          flex flex-col items-center w-full max-w-[640px] px-6
          ${(parsedVideo || parsedPlaylist || isParsing) ? 'pt-6 pb-8' : 'flex-1 justify-center -mt-6'}
        `}
      >
        {/* Empty state illustration */}
        <AnimatePresence>
          {!parsedVideo && !parsedPlaylist && !isParsing && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="flex flex-col items-center mb-10"
            >
              <div className="relative mb-6">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="
                    w-16 h-16 rounded-[--radius-xl]
                    bg-gradient-to-br from-accent-soft to-[#FDE8DF]
                    flex items-center justify-center
                    shadow-[0_2px_12px_rgba(232,101,74,0.08)]
                  "
                >
                  <ArrowDown className="w-7 h-7 text-accent" strokeWidth={1.8} />
                </motion.div>
                <div className="absolute -inset-2 rounded-[22px] border border-accent/[0.06]" />
              </div>

              <h2 className="text-[22px] font-semibold text-text-primary tracking-[-0.02em] mb-2">
                Download a video
              </h2>
              <p className="text-[14px] text-text-tertiary text-center leading-relaxed max-w-[360px]">
                Paste a video link below to get started.
                <br />
                <span className="text-text-placeholder text-[13px]">
                  Supports YouTube, Bilibili, Twitter, and 1000+ sites
                </span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* URL Input Bar */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full"
        >
          <URLInput />
        </motion.div>

        {/* Parse skeleton / Options Panel */}
        <AnimatePresence mode="wait">
          {isParsing && !parsedVideo && !parsedPlaylist && <ParseSkeleton key="skeleton" />}
          {parsedVideo && <OptionsPanel key="options" />}
          {parsedPlaylist && <PlaylistPanel key="playlist" />}
        </AnimatePresence>
      </motion.div>
    </motion.main>
  )
}

