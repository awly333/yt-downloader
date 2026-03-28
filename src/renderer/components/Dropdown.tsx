import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'
import { useTranslation } from '../i18n'

export interface DropdownOption {
  value: string
  label: string
  sublabel?: string
}

interface DropdownProps {
  value: string
  onChange: (value: string) => void
  options: DropdownOption[]
  placeholder?: string
  compact?: boolean
  maxHeight?: number
}

export function Dropdown({
  value,
  onChange,
  options,
  placeholder,
  compact = false,
  maxHeight = 280,
}: DropdownProps) {
  const t = useTranslation()
  const resolvedPlaceholder = placeholder ?? t.selectPlaceholder
  const [isOpen, setIsOpen] = useState(false)
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({})
  const [openUpward, setOpenUpward] = useState(false)
  const [listMaxHeight, setListMaxHeight] = useState(maxHeight)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)

  // Compute popup position from trigger rect — opens downward by default,
  // flips upward when there isn't enough space below the trigger.
  const measureAndOpen = () => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const GAP = 4
    const MIN_HEIGHT = 120
    const spaceBelow = window.innerHeight - rect.bottom - GAP
    const spaceAbove = rect.top - GAP

    const goUp = spaceBelow < MIN_HEIGHT && spaceAbove > spaceBelow

    if (goUp) {
      const avail = Math.min(maxHeight, spaceAbove)
      setListMaxHeight(Math.max(avail, MIN_HEIGHT))
      setPopupStyle({
        position: 'fixed',
        bottom: window.innerHeight - rect.top + GAP,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      })
    } else {
      const avail = Math.min(maxHeight, Math.max(spaceBelow, MIN_HEIGHT))
      setListMaxHeight(avail)
      setPopupStyle({
        position: 'fixed',
        top: rect.bottom + GAP,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      })
    }
    setOpenUpward(goUp)
    setIsOpen(true)
  }

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (containerRef.current && !containerRef.current.contains(target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen])

  // Close on Escape or page scroll (but NOT when scrolling inside the dropdown list)
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false) }
    const onScroll = (e: Event) => {
      // Ignore scroll events originating from inside the dropdown list
      if (listRef.current && listRef.current.contains(e.target as Node)) return
      setIsOpen(false)
    }
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [isOpen])

  // Scroll selected item into view when opened
  useEffect(() => {
    if (isOpen && listRef.current) {
      const selectedEl = listRef.current.querySelector('[data-selected="true"]')
      if (selectedEl) selectedEl.scrollIntoView({ block: 'nearest' })
    }
  }, [isOpen])

  const handleSelect = (optValue: string) => {
    onChange(optValue)
    setIsOpen(false)
  }

  const popup = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: openUpward ? 4 : -4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: openUpward ? 4 : -4, scale: 0.98 }}
          transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ ...popupStyle, transformOrigin: openUpward ? 'bottom left' : 'top left' }}
          className="
            bg-surface-raised
            border border-border
            rounded-[--radius-md]
            shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)]
            overflow-hidden
          "
        >
          <div
            ref={listRef}
            className="overflow-y-auto py-1"
            style={{ maxHeight: listMaxHeight }}
          >
            {options.map((option) => {
              const isSelected = option.value === value
              return (
                <button
                  key={option.value}
                  data-selected={isSelected}
                  onClick={() => handleSelect(option.value)}
                  className={`
                    w-full flex items-center gap-2 px-3 text-left
                    transition-colors duration-75 cursor-pointer
                    ${compact ? 'py-1.5 text-[12px]' : 'py-2 text-[13px]'}
                    ${isSelected
                      ? 'bg-accent-soft text-accent font-medium'
                      : 'text-text-primary hover:bg-surface-hover'
                    }
                  `}
                >
                  <span className={`w-4 flex-shrink-0 ${isSelected ? 'opacity-100' : 'opacity-0'}`}>
                    <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block truncate">{option.label}</span>
                    {option.sublabel && (
                      <span className="block text-[11px] text-text-tertiary truncate mt-0.5">
                        {option.sublabel}
                      </span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => isOpen ? setIsOpen(false) : measureAndOpen()}
        className={`
          w-full flex items-center justify-between
          rounded-[--radius-md]
          bg-surface-sunken border border-border
          text-text-primary
          outline-none
          transition-all duration-150
          cursor-pointer
          ${isOpen
            ? 'border-accent/30 shadow-[0_0_0_3px_rgba(232,101,74,0.06)]'
            : 'hover:border-border hover:bg-surface-hover'
          }
          ${compact ? 'px-2.5 py-1.5 text-[12px]' : 'px-3 py-2 text-[13px]'}
        `}
      >
        <span className={`truncate text-left ${!selected ? 'text-text-placeholder' : ''}`}>
          {selected ? selected.label : resolvedPlaceholder}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="ml-2 flex-shrink-0"
        >
          <ChevronDown className="w-3.5 h-3.5 text-text-tertiary" />
        </motion.span>
      </button>

      {/* Portal popup — renders at document.body, escaping any overflow clipping */}
      {createPortal(popup, document.body)}
    </div>
  )
}
