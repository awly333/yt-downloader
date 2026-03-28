// ── Video Info (from yt-dlp --dump-json) ─────────────────────

export interface VideoFormat {
  format_id: string
  format_note: string
  ext: string
  resolution: string
  fps: number | null
  vcodec: string
  acodec: string
  filesize: number | null
  filesize_approx: number | null
}

export interface SubtitleTrack {
  language: string
  languageName: string
  ext: string
  url: string
  isAutomatic: boolean
}

export interface ParsedVideoFormat {
  label: string           // e.g. "1080p 60fps (mp4)" or "128kbps (m4a)"
  value: string           // format_id or resolution shorthand
  type: 'video' | 'audio'
  resolution?: string     // e.g. "1920x1080"
  fps?: number
  ext: string
  filesize?: number       // bytes
  codec: string
  bitrate?: string
}

export interface VideoInfo {
  id: string
  title: string
  description: string
  thumbnail: string
  duration: number
  uploader: string
  url: string
  formats: VideoFormat[]
  subtitles: SubtitleTrack[]
  availableResolutions: string[]   // e.g. ['2160p', '1080p', '720p', ...]
  videoFormats: ParsedVideoFormat[] // detailed video-only formats
  audioFormats: ParsedVideoFormat[] // detailed audio-only formats
}

// ── Playlist ─────────────────────────────────────────────────

export interface PlaylistEntry {
  id: string
  title: string
  url: string
  duration: number
  uploader: string
}

export interface PlaylistInfo {
  title: string
  url: string
  thumbnail: string
  entryCount: number
  entries: PlaylistEntry[]
}

export type ParseResult =
  | { type: 'video'; video: VideoInfo }
  | { type: 'playlist'; playlist: PlaylistInfo }

// ── Download Task ────────────────────────────────────────────

export type DownloadStatus =
  | 'queued'
  | 'downloading'
  | 'merging'
  | 'completed'
  | 'failed'

export interface DownloadOptions {
  url: string
  fileName: string
  saveDir: string
  fileType: string          // mp4, mkv, webm, mp3, m4a, wav
  videoFormat: string       // 'best', 'worst', '1080p', '720p', etc.
  audioFormat: string       // 'best', 'worst'
  useCookies: boolean
  cookieBrowser: string     // 'chrome', 'edge', 'firefox', 'brave'
  subtitleLangs: string[]   // selected subtitle language codes
  subtitleFormat: string    // 'original' | 'srt' | 'vtt' | 'ass' | 'lrc'
}

export interface DownloadProgress {
  taskId: string
  percent: number           // 0–100
  speed: string             // e.g. '2.5MiB/s'
  eta: string               // e.g. '00:30'
  status: DownloadStatus
  error?: string
}

export interface DownloadTask {
  id: string
  options: DownloadOptions
  thumbnail: string
  status: DownloadStatus
  progress: number          // 0–100
  speed: string
  eta: string
  filePath: string | null   // set on completion
  error: string | null
  createdAt: number
}

// ── Settings ─────────────────────────────────────────────────

export interface AppSettings {
  downloadDir: string
  defaultFileType: string
  defaultVideoFormat: string
  defaultAudioFormat: string
  cookieBrowser: string
  language: string
  skipDeleteConfirm: boolean
  defaultSubtitleFormat: string
  bandwidthLimit: string           // 'unlimited', '512k', '1m', '2m', '5m', '10m'
}

// ── IPC Channels ─────────────────────────────────────────────

export interface IpcApi {
  parseUrl: (url: string, useCookies: boolean, cookieBrowser: string) => Promise<ParseResult>
  startDownload: (options: DownloadOptions) => Promise<string>  // returns taskId
  cancelDownload: (taskId: string) => Promise<void>
  selectFolder: (defaultPath?: string) => Promise<string | null>
  openFile: (filePath: string) => Promise<void>
  openFolder: (filePath: string) => Promise<void>
  deleteFile: (filePath: string) => Promise<boolean>
  deleteDownloadFiles: (saveDir: string, fileName: string) => Promise<boolean>
  getSettings: () => Promise<AppSettings>
  setSettings: (settings: Partial<AppSettings>) => Promise<void>
  getDownloadsDir: () => Promise<string>
  getAppVersion: () => Promise<string>
  openExternal: (url: string) => Promise<void>
  getCookiesDir: () => Promise<string>
  uninstallApp: () => Promise<void>
  onDownloadProgress: (callback: (progress: DownloadProgress) => void) => () => void
  // History persistence
  loadHistory: () => Promise<DownloadTask[]>
  saveHistory: (tasks: DownloadTask[]) => Promise<void>
  // Context menu
  showContextMenu: (taskId: string, status: DownloadStatus, hasFile: boolean) => Promise<string | null>
  onContextMenuAction: (callback: (action: { taskId: string; action: string }) => void) => () => void
  minimizeWindow: () => Promise<void>
  maximizeWindow: () => Promise<void>
  closeWindow: () => Promise<void>
  isMaximized: () => Promise<boolean>
  onWindowMaximize: (callback: (maximized: boolean) => void) => () => void
}
