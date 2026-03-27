import { contextBridge, ipcRenderer } from 'electron'
import type { DownloadOptions, DownloadProgress, AppSettings } from '../shared/types'


contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,

  // yt-dlp
  parseUrl: (url: string, useCookies: boolean, cookieBrowser: string) => ipcRenderer.invoke('ytdlp:parse-url', url, useCookies, cookieBrowser),
  startDownload: (options: DownloadOptions) => ipcRenderer.invoke('ytdlp:start-download', options),
  cancelDownload: (taskId: string) => ipcRenderer.invoke('ytdlp:cancel-download', taskId),

  // Dialogs
  selectFolder: (defaultPath?: string) => ipcRenderer.invoke('dialog:select-folder', defaultPath),

  // Shell
  openFile: (filePath: string) => ipcRenderer.invoke('shell:open-file', filePath),
  openFolder: (filePath: string) => ipcRenderer.invoke('shell:open-folder', filePath),
  deleteFile: (filePath: string) => ipcRenderer.invoke('shell:delete-file', filePath) as Promise<boolean>,
  deleteDownloadFiles: (saveDir: string, fileName: string) => ipcRenderer.invoke('shell:delete-download-files', saveDir, fileName) as Promise<boolean>,

  // Settings
  getSettings: () => ipcRenderer.invoke('store:get-settings'),
  setSettings: (settings: Partial<AppSettings>) => ipcRenderer.invoke('store:set-settings', settings),
  getDownloadsDir: () => ipcRenderer.invoke('app:get-downloads-dir'),
  getAppVersion: () => ipcRenderer.invoke('app:get-version') as Promise<string>,
  openExternal: (url: string) => ipcRenderer.invoke('shell:open-external', url),

  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:is-maximized') as Promise<boolean>,
  onWindowMaximize: (callback: (maximized: boolean) => void) => {
    const handler = (_: Electron.IpcRendererEvent, maximized: boolean) => callback(maximized)
    ipcRenderer.on('window:maximized', handler)
    return () => ipcRenderer.removeListener('window:maximized', handler)
  },

  // Download progress listener
  onDownloadProgress: (callback: (progress: DownloadProgress) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, progress: DownloadProgress) => {
      callback(progress)
    }
    ipcRenderer.on('download:progress', handler)
    return () => {
      ipcRenderer.removeListener('download:progress', handler)
    }
  },
})
