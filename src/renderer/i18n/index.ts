import { useSettingsStore } from '../stores/settingsStore'
import { en } from './en'
import { zh } from './zh'
import { ja } from './ja'
import { ko } from './ko'
import { es } from './es'
import { fr } from './fr'
import { de } from './de'
import type { Translations } from './types'

const translations: Record<string, Translations> = { en, zh, ja, ko, es, fr, de }

export function useTranslation(): Translations {
  const language = useSettingsStore((s) => s.settings.language)
  return translations[language] ?? translations.en
}

export type { Translations }
