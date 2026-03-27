import { create } from 'zustand'
import type { VideoInfo } from '../../shared/types'

type AppView = 'home' | 'settings'

interface AppStore {
  view: AppView
  parsedVideo: VideoInfo | null
  isParsing: boolean
  parseError: string | null
  useCookies: boolean
  showAbout: boolean

  setView: (view: AppView) => void
  setParsedVideo: (video: VideoInfo | null) => void
  setIsParsing: (parsing: boolean) => void
  setParseError: (error: string | null) => void
  resetParse: () => void
  setUseCookies: (v: boolean) => void
  setShowAbout: (v: boolean) => void
}

export const useAppStore = create<AppStore>((set) => ({
  view: 'home',
  parsedVideo: null,
  isParsing: false,
  parseError: null,
  useCookies: false,
  showAbout: false,

  setView: (view) => set({ view }),
  setParsedVideo: (video) => set({ parsedVideo: video, parseError: null, isParsing: false }),
  setIsParsing: (parsing) => set({ isParsing: parsing }),
  setParseError: (error) => set(error !== null ? { parseError: error, isParsing: false } : { parseError: null }),
  resetParse: () => set({ parsedVideo: null, isParsing: false, parseError: null }),
  setUseCookies: (v) => set({ useCookies: v }),
  setShowAbout: (v) => set({ showAbout: v }),
}))
