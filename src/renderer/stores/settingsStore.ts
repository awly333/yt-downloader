import { create } from 'zustand'
import type { AppSettings } from '../../shared/types'

interface SettingsStore {
  settings: AppSettings
  loaded: boolean

  loadSettings: () => Promise<void>
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>
}

const defaultSettings: AppSettings = {
  downloadDir: '',
  defaultFileType: 'mp4',
  defaultVideoFormat: 'best',
  defaultAudioFormat: 'best',
  cookieBrowser: 'chrome',
  language: 'en',
  skipDeleteConfirm: false,
  defaultSubtitleFormat: 'original',
  bandwidthLimit: 'unlimited',
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: defaultSettings,
  loaded: false,

  loadSettings: async () => {
    try {
      const settings = await window.electronAPI.getSettings()
      set({ settings, loaded: true })
    } catch (err) {
      console.error('Failed to load settings:', err)
      // Use defaults with system downloads dir
      const downloadDir = await window.electronAPI.getDownloadsDir()
      set({ settings: { ...defaultSettings, downloadDir }, loaded: true })
    }
  },

  updateSettings: async (partial) => {
    try {
      await window.electronAPI.setSettings(partial)
      set((state) => ({
        settings: { ...state.settings, ...partial },
      }))
    } catch (err) {
      console.error('Failed to save settings:', err)
    }
  },
}))
