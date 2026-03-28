export interface Translations {
  // App-wide
  appSubtitle: string

  // Sidebar
  downloads: string
  clearAll: string
  settings: string

  // URL input / parse errors
  urlPlaceholder: string
  parsing: string
  useCookies: string
  errorSignIn: string
  errorCookies: string

  // MainArea
  fetchingInfo: string
  dropUrl: string
  emptyTitle: string
  emptySubtitle: string
  emptySites: string

  // DownloadList
  noDownloads: string
  pasteUrl: string

  // DownloadItem tooltips
  openFile: string
  openFolder: string
  retry: string
  remove: string

  // Status text
  statusQueued: string
  statusMerging: string
  statusCompleted: string
  statusFailed: string

  // OptionsPanel / PlaylistPanel
  fileName: string
  folderName: string
  saveTo: string
  selectFolder: string
  fileType: string
  videoQuality: string
  audioQuality: string
  subtitles: string
  subtitleFormat: string
  download: string
  bestQuality: string
  worstQuality: string
  autoSubtitle: string
  manualSubtitle: string
  selectAll: string
  deselectAll: string
  downloadN: (n: number) => string
  entryCount: (n: number) => string

  // File type sublabels
  ftVideoCompatible: string
  ftVideoHighQuality: string
  ftVideoWebOptimized: string
  ftVideoLegacy: string
  ftAudioUniversal: string
  ftAudioAac: string
  ftAudioModern: string
  ftAudioLosslessLarge: string
  ftAudioLosslessCompressed: string
  ftAudioHighQuality: string

  // Subtitle format sublabels
  sfKeepAsDownloaded: string
  sfMostCompatible: string
  sfWebStandard: string
  sfAdvancedStyling: string
  sfLyricsFormat: string

  // Bandwidth
  bwNoLimit: string

  // SettingsPage
  settingsTitle: string
  settingDownloadDir: string
  settingDefaultFileType: string
  settingDefaultVideoQuality: string
  settingDefaultAudioQuality: string
  settingDefaultSubtitleFormat: string
  settingSpeedLimit: string
  settingSpeedLimitHint: string
  settingCookieBrowser: string
  settingCookieBrowserHint: string
  settingLanguage: string
  settingHistory: string
  settingHistoryHint: string
  clearCompleted: string
  settingUninstall: string
  settingUninstallDesc: string
  uninstallButton: string
  uninstallConfirmTitle: string
  uninstallConfirmDesc: string
  cancel: string
  confirmUninstall: string
  uninstalling: string
  supportTitle: string
  supportDesc: string
  buyMeCoffee: string

  // ConfirmDeleteDialog
  removeDownloadTitle: string
  clearAllCompletedTitle: string
  removeDialogDescSingle: string
  removeDialogDescAll: string
  dontAskAgain: string
  removeFromList: string
  deleteFilesToo: string

  // AboutDialog
  version: string
  aboutDesc: string
  viewOnGitHub: string
  supportDevelopment: string
  poweredBy: string

  // ErrorBoundary
  somethingWrong: string
  unexpectedError: string
  reloadApp: string

  // Dropdown
  selectPlaceholder: string
}
