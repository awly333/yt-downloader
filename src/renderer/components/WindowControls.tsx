import { useState, useEffect } from 'react'

export function WindowControls() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    window.electronAPI.isMaximized().then(setIsMaximized)
    const unsub = window.electronAPI.onWindowMaximize(setIsMaximized)
    return unsub
  }, [])

  return (
    <div
      className="flex items-stretch h-full ml-auto"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      {/* Minimize */}
      <WinBtn onClick={() => window.electronAPI.minimizeWindow()} label="Minimize">
        <MinimizeIcon />
      </WinBtn>

      {/* Maximize / Restore */}
      <WinBtn
        onClick={() => window.electronAPI.maximizeWindow()}
        label={isMaximized ? 'Restore' : 'Maximize'}
      >
        {isMaximized ? <RestoreIcon /> : <MaximizeIcon />}
      </WinBtn>

      {/* Close */}
      <WinBtn onClick={() => window.electronAPI.closeWindow()} label="Close" isClose>
        <CloseIcon />
      </WinBtn>
    </div>
  )
}

function WinBtn({
  onClick,
  label,
  isClose = false,
  children,
}: {
  onClick: () => void
  label: string
  isClose?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`
        w-[46px] flex items-center justify-center
        transition-colors duration-100
        cursor-pointer outline-none
        text-text-tertiary
        ${isClose
          ? 'hover:bg-[#C42B1C] hover:text-white'
          : 'hover:bg-surface-hover hover:text-text-secondary'
        }
      `}
    >
      {children}
    </button>
  )
}

function MinimizeIcon() {
  return (
    <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
      <rect width="10" height="1" />
    </svg>
  )
}

function MaximizeIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
      <rect x="0.5" y="0.5" width="9" height="9" />
    </svg>
  )
}

function RestoreIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
      {/* Front window */}
      <rect x="0.5" y="2.5" width="7" height="7" />
      {/* Back window peek */}
      <path d="M2.5 2.5V1.5H9.5V8.5H8.5" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <line x1="0" y1="0" x2="10" y2="10" />
      <line x1="10" y1="0" x2="0" y2="10" />
    </svg>
  )
}
