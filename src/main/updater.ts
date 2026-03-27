import { autoUpdater } from 'electron-updater'
import { dialog, app } from 'electron'

// Don't auto-download — ask the user first
autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

export function initUpdater(): void {
  // Only check in production
  if (!app.isPackaged) return

  autoUpdater.on('update-available', (info) => {
    dialog
      .showMessageBox({
        type: 'info',
        title: 'Update available',
        message: `YT Downloader ${info.version} is available.`,
        detail: 'A new version has been released. Download and install it now?',
        buttons: ['Download', 'Later'],
        defaultId: 0,
        cancelId: 1,
      })
      .then(({ response }) => {
        if (response === 0) {
          autoUpdater.downloadUpdate()
        }
      })
  })

  autoUpdater.on('update-downloaded', (info) => {
    dialog
      .showMessageBox({
        type: 'info',
        title: 'Update ready',
        message: `YT Downloader ${info.version} has been downloaded.`,
        detail: 'The update will be applied after restarting the app.',
        buttons: ['Restart now', 'Later'],
        defaultId: 0,
        cancelId: 1,
      })
      .then(({ response }) => {
        if (response === 0) {
          autoUpdater.quitAndInstall()
        }
      })
  })

  autoUpdater.on('error', (err) => {
    console.error('[updater] error:', err)
  })

  // Check after a short delay so the window finishes loading first
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      console.error('[updater] checkForUpdates failed:', err)
    })
  }, 8000)
}
