import { ipcMain, dialog, shell, app, BrowserWindow, Menu } from 'electron'
import path from 'path'
import fs from 'fs'
import { spawn } from 'child_process'
import { parseUrl, startDownload, cancelDownload, getCookiesDir } from './ytdlp'
import type { DownloadOptions, DownloadTask, DownloadStatus, AppSettings, ParseResult } from '../shared/types'

function getSettingsPath() {
  return path.join(app.getPath('userData'), 'settings.json')
}

function getHistoryPath() {
  return path.join(app.getPath('userData'), 'download-history.json')
}

function readSettings(): AppSettings {
  const defaults: AppSettings = {
    downloadDir: app.getPath('downloads'),
    defaultFileType: 'mp4',
    defaultVideoFormat: 'best',
    defaultAudioFormat: 'best',
    cookieBrowser: 'chrome',
    language: 'en',
    skipDeleteConfirm: false,
    defaultSubtitleFormat: 'original',
    bandwidthLimit: 'unlimited',
  }
  try {
    const data = fs.readFileSync(getSettingsPath(), 'utf-8')
    return { ...defaults, ...JSON.parse(data) }
  } catch {
    return defaults
  }
}

function writeSettings(partial: Partial<AppSettings>): void {
  const current = readSettings()
  const updated = { ...current, ...partial }
  fs.writeFileSync(getSettingsPath(), JSON.stringify(updated, null, 2))
}

export function setupWindowEvents(win: BrowserWindow): void {
  win.on('maximize', () => win.webContents.send('window:maximized', true))
  win.on('unmaximize', () => win.webContents.send('window:maximized', false))
}

export function registerIpcHandlers(): void {
  // Window controls
  ipcMain.handle('window:minimize', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize()
  })
  ipcMain.handle('window:maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win?.isMaximized()) win.unmaximize()
    else win?.maximize()
  })
  ipcMain.handle('window:close', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close()
  })
  ipcMain.handle('window:is-maximized', (event) => {
    return BrowserWindow.fromWebContents(event.sender)?.isMaximized() ?? false
  })
  ipcMain.handle('ytdlp:parse-url', async (_event, url: string, useCookies: boolean, cookieBrowser: string) => {
    return parseUrl(url, useCookies ? cookieBrowser : undefined)
  })

  ipcMain.handle('ytdlp:start-download', async (event, options: DownloadOptions) => {
    const taskId = `dl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const win = BrowserWindow.fromWebContents(event.sender)
    const settings = readSettings()
    const bandwidthLimit = settings.bandwidthLimit !== 'unlimited' ? settings.bandwidthLimit : undefined

    startDownload(taskId, options, bandwidthLimit, (progress) => {
      if (win && !win.isDestroyed()) {
        win.webContents.send('download:progress', progress)
      }
    })

    return taskId
  })

  ipcMain.handle('ytdlp:cancel-download', async (_event, taskId: string) => {
    cancelDownload(taskId)
  })

  ipcMain.handle('dialog:select-folder', async (_event, defaultPath?: string) => {
    const result = await dialog.showOpenDialog({
      defaultPath: defaultPath || app.getPath('downloads'),
      properties: ['openDirectory'],
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('shell:open-file', async (_event, filePath: string) => {
    await shell.openPath(filePath)
  })

  ipcMain.handle('shell:open-folder', async (_event, filePath: string) => {
    shell.showItemInFolder(filePath)
  })

  ipcMain.handle('shell:delete-file', async (_event, filePath: string) => {
    try {
      await fs.promises.unlink(filePath)
      return true
    } catch {
      return false
    }
  })

  // Delete all files for a completed download: video + subtitle files (filename.*)
  // After deleting, attempt to remove saveDir if it is now empty (handles playlist folders).
  ipcMain.handle('shell:delete-download-files', async (_event, saveDir: string, fileName: string) => {
    try {
      const files = await fs.promises.readdir(saveDir)
      const prefix = fileName + '.'
      for (const file of files) {
        if (file.startsWith(prefix)) {
          try {
            await fs.promises.unlink(path.join(saveDir, file))
          } catch { /* ignore individual failures */ }
        }
      }
      // Try to remove the directory — succeeds only if it is now empty
      try {
        const remaining = await fs.promises.readdir(saveDir)
        if (remaining.length === 0) {
          await fs.promises.rmdir(saveDir)
        }
      } catch { /* not empty or already gone — ignore */ }
      return true
    } catch {
      return false
    }
  })

  ipcMain.handle('store:get-settings', async () => {
    return readSettings()
  })

  ipcMain.handle('store:set-settings', async (_event, partial: Partial<AppSettings>) => {
    writeSettings(partial)
  })

  ipcMain.handle('app:get-downloads-dir', async () => {
    return app.getPath('downloads')
  })

  ipcMain.handle('app:get-version', async () => {
    return app.getVersion()
  })

  ipcMain.handle('shell:open-external', async (_event, url: string) => {
    if (url.startsWith('https://')) {
      await shell.openExternal(url)
    }
  })

  ipcMain.handle('app:uninstall', async () => {
    const userDataPath = app.getPath('userData')

    // Delete our own data files (settings, history, cookies).
    // Downloaded videos are NOT touched — they live in the user's chosen directory.
    const ownFiles = ['settings.json', 'download-history.json']
    for (const f of ownFiles) {
      try { fs.unlinkSync(path.join(userDataPath, f)) } catch {}
    }
    try { fs.rmSync(path.join(userDataPath, 'cookies'), { recursive: true, force: true }) } catch {}

    if (process.platform === 'win32') {
      // Schedule full userData cleanup after the process exits (some Electron
      // files are locked while the app is running).
      const cleanupScript = [
        '@echo off',
        'timeout /t 4 /nobreak > nul',
        `rmdir /s /q "${userDataPath}"`,
        'del "%~f0"',
      ].join('\r\n')
      const scriptPath = path.join(app.getPath('temp'), 'yt-downloader-cleanup.bat')
      fs.writeFileSync(scriptPath, cleanupScript)
      spawn('cmd', ['/c', scriptPath], { detached: true, stdio: 'ignore' }).unref()

      // Run the NSIS uninstaller silently
      const uninstallerPath = path.join(
        path.dirname(app.getPath('exe')),
        'Uninstall YT Downloader.exe',
      )
      if (fs.existsSync(uninstallerPath)) {
        spawn(uninstallerPath, ['/S'], { detached: true, stdio: 'ignore' }).unref()
      }
    } else if (process.platform === 'darwin') {
      // Move the .app bundle to trash, then clean up userData
      const appBundle = path.resolve(app.getPath('exe'), '../../..')
      await shell.trashItem(appBundle)
      try { fs.rmSync(userDataPath, { recursive: true, force: true }) } catch {}
    } else {
      // Linux AppImage: delete the AppImage file + userData
      try { fs.unlinkSync(process.execPath) } catch {}
      try { fs.rmSync(userDataPath, { recursive: true, force: true }) } catch {}
    }

    app.quit()
  })

  ipcMain.handle('app:get-cookies-dir', async () => {
    const dir = getCookiesDir()
    // Ensure the directory exists so users can find and populate it
    await fs.promises.mkdir(dir, { recursive: true })
    return dir
  })

  // ── Download history persistence ──────────────────────────────

  ipcMain.handle('history:load', async () => {
    try {
      const data = fs.readFileSync(getHistoryPath(), 'utf-8')
      return JSON.parse(data) as DownloadTask[]
    } catch {
      return []
    }
  })

  ipcMain.handle('history:save', async (_event, tasks: DownloadTask[]) => {
    // Only persist completed and failed tasks (not in-progress ones)
    const persistable = tasks
      .filter((t) => t.status === 'completed' || t.status === 'failed')
      .map((t) => ({ ...t, speed: '', eta: '' }))
    fs.writeFileSync(getHistoryPath(), JSON.stringify(persistable, null, 2))
  })

  // ── Native context menu for download items ────────────────────

  ipcMain.handle('context-menu:show', async (event, taskId: string, status: DownloadStatus, hasFile: boolean) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return null

    return new Promise<string | null>((resolve) => {
      const items: Electron.MenuItemConstructorOptions[] = []

      if (status === 'completed' && hasFile) {
        items.push(
          { label: 'Open file', click: () => resolve('open-file') },
          { label: 'Open folder', click: () => resolve('open-folder') },
          { type: 'separator' },
        )
      }
      if (status === 'failed') {
        items.push(
          { label: 'Retry', click: () => resolve('retry') },
        )
      }
      if (status === 'downloading' || status === 'queued') {
        items.push(
          { label: 'Cancel', click: () => resolve('cancel') },
        )
      }

      items.push(
        { label: 'Copy URL', click: () => resolve('copy-url') },
      )

      if (status === 'completed' || status === 'failed') {
        items.push(
          { type: 'separator' },
          { label: 'Remove from list', click: () => resolve('remove') },
        )
        if (status === 'completed' && hasFile) {
          items.push(
            { label: 'Delete file', click: () => resolve('delete-file') },
          )
        }
      }

      const menu = Menu.buildFromTemplate(items)
      menu.popup({ window: win })
      menu.on('menu-will-close', () => {
        // If no item was clicked, resolve null after a tick
        setTimeout(() => resolve(null), 100)
      })
    })
  })
}
