import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link2, ArrowRight, Loader2, Check, FolderOpen } from 'lucide-react'
import { Dropdown } from './Dropdown'
import { useAppStore } from '../stores/appStore'
import { useSettingsStore } from '../stores/settingsStore'

const BROWSER_OPTIONS = [
  { value: 'chrome', label: 'Chrome' },
  { value: 'edge', label: 'Edge' },
  { value: 'firefox', label: 'Firefox' },
  { value: 'brave', label: 'Brave' },
  { value: 'local', label: 'Local' },
]

function simplifyError(raw: string): string {
  if (raw.includes('Sign in to confirm') || raw.includes('not a bot')) {
    return 'YouTube requires sign-in for this video. Enable "Use browser cookies" and try again.'
  }
  if ((raw.includes('Could not copy') || raw.includes('DPAPI') || raw.includes('Failed to decrypt')) && raw.includes('cookie')) {
    return 'Could not read browser cookies. Close the browser and try again, or switch to a different browser.'
  }
  // Strip "Error invoking remote method '...': Error:" prefix if present
  const match = raw.match(/Error:\s*(.+)$/s)
  return match ? match[1].trim() : raw
}

export function URLInput() {
  const [url, setUrl] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [cookiesDir, setCookiesDir] = useState('')
  const { isParsing, setIsParsing, setParsedVideo, setParsedPlaylist, setParseError, parseError, useCookies, setUseCookies } = useAppStore()
  const { settings, updateSettings } = useSettingsStore()

  useEffect(() => {
    window.electronAPI.getCookiesDir().then(setCookiesDir)
  }, [])

  const hasUrl = url.trim().length > 0

  const handleSubmit = useCallback(async () => {
    const trimmed = url.trim()
    if (!trimmed || isParsing) return

    setIsParsing(true)
    setParseError(null)

    try {
      const result = await window.electronAPI.parseUrl(trimmed, useCookies, settings.cookieBrowser)
      if (result.type === 'playlist') {
        setParsedPlaylist(result.playlist)
      } else {
        setParsedVideo(result.video)
      }
      setUrl('')
    } catch (err: any) {
      setParseError(simplifyError(err.message || 'Failed to parse URL'))
    }
  }, [url, isParsing, useCookies, settings.cookieBrowser, setIsParsing, setParsedVideo, setParsedPlaylist, setParseError])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="w-full">
      {/* URL input bar */}
      <motion.div
        className={`
          relative w-full
          rounded-[--radius-pill]
          transition-all duration-200 ease-out
          ${isFocused
            ? 'shadow-[0_0_0_3px_rgba(232,101,74,0.1),0_2px_16px_rgba(0,0,0,0.06)]'
            : 'shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
          }
        `}
      >
        <div className={`
          flex items-center
          bg-surface-raised
          rounded-[--radius-pill]
          border
          transition-colors duration-200
          ${parseError ? 'border-error/40' : isFocused ? 'border-accent/30' : 'border-border'}
        `}>
          <div className="pl-5 pr-1 flex items-center">
            {isParsing ? (
              <Loader2 className="w-[18px] h-[18px] text-accent animate-spin" strokeWidth={1.8} />
            ) : (
              <Link2
                className={`w-[18px] h-[18px] transition-colors duration-200 ${isFocused ? 'text-accent' : 'text-text-placeholder'}`}
                strokeWidth={1.8}
              />
            )}
          </div>

          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              if (parseError) setParseError(null)
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={isParsing ? 'Parsing video info...' : 'Paste a video URL here...'}
            disabled={isParsing}
            className="
              flex-1 py-3.5 px-3
              bg-transparent
              text-[15px] text-text-primary
              placeholder:text-text-placeholder
              outline-none font-normal
              disabled:opacity-60
            "
            spellCheck={false}
            autoComplete="off"
          />

          <div className="pr-2">
            <motion.button
              whileHover={hasUrl && !isParsing ? { scale: 1.04 } : undefined}
              whileTap={hasUrl && !isParsing ? { scale: 0.96 } : undefined}
              disabled={!hasUrl || isParsing}
              onClick={handleSubmit}
              className={`
                flex items-center justify-center w-9 h-9
                rounded-full transition-all duration-200
                cursor-pointer disabled:cursor-not-allowed
                ${hasUrl && !isParsing
                  ? 'bg-accent text-white shadow-sm hover:bg-accent-hover'
                  : 'bg-surface-sunken text-text-placeholder'
                }
              `}
            >
              {isParsing
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <ArrowRight className="w-4 h-4" strokeWidth={2} />
              }
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Cookie controls */}
      <div className="flex items-center gap-2.5 mt-3 px-1">
        <button
          onClick={() => setUseCookies(!useCookies)}
          className={`
            w-[18px] h-[18px] rounded-[4px] border-2
            flex items-center justify-center flex-shrink-0
            transition-all duration-150 cursor-pointer
            ${useCookies ? 'bg-accent border-accent' : 'border-border hover:border-text-tertiary'}
          `}
        >
          {useCookies && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
        </button>

        <span className="text-[13px] text-text-secondary font-medium flex-1 select-none">
          Use browser cookies
        </span>

        <AnimatePresence>
          {useCookies && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-[110px] flex-shrink-0"
            >
              <Dropdown
                value={settings.cookieBrowser}
                onChange={(v) => updateSettings({ cookieBrowser: v })}
                options={BROWSER_OPTIONS}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cookies folder path — shown when Local is selected */}
      <AnimatePresence>
        {useCookies && settings.cookieBrowser === 'local' && cookiesDir && (
          <motion.button
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            onClick={() => window.electronAPI.openFile(cookiesDir)}
            className="
              mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-[--radius-md]
              bg-surface-sunken border border-border
              text-left cursor-pointer
              hover:bg-surface-hover transition-colors duration-150
            "
          >
            <FolderOpen className="w-3.5 h-3.5 text-text-tertiary flex-shrink-0" />
            <span className="text-[11px] text-text-secondary truncate flex-1">{cookiesDir}</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Error message */}
      {parseError && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-[12px] text-error text-center leading-relaxed"
        >
          {parseError}
        </motion.p>
      )}
    </div>
  )
}
