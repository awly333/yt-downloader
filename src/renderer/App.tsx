import { useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Sidebar } from './components/Sidebar'
import { MainArea } from './components/MainArea'
import { SettingsPage } from './components/SettingsPage'
import { WindowControls } from './components/WindowControls'
import { ConfirmDeleteDialog } from './components/ConfirmDeleteDialog'
import { AboutDialog } from './components/AboutDialog'
import { useAppStore } from './stores/appStore'
import { useSettingsStore } from './stores/settingsStore'
import { useDownloadStore } from './stores/downloadStore'

export function App() {
  const { view } = useAppStore()
  const { loadSettings } = useSettingsStore()
  const { updateProgress } = useDownloadStore()

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  useEffect(() => {
    const unsubscribe = window.electronAPI.onDownloadProgress((progress) => {
      updateProgress(progress)
    })
    return unsubscribe
  }, [updateProgress])

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-surface">
      {/* Titlebar — drag region with custom window controls */}
      <div className="titlebar shrink-0 flex items-stretch overflow-hidden">
        <WindowControls />
      </div>

      {/* Content below titlebar */}
      <div className="flex flex-1 min-h-0">
        <Sidebar />

        <AnimatePresence mode="wait">
          {view === 'settings' ? (
            <SettingsPage key="settings" />
          ) : (
            <MainArea key="home" />
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <ConfirmDeleteDialog />
      <AboutDialog />
    </div>
  )
}
