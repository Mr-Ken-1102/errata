import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type AppLanguage = 'en' | 'vi'

export const DEFAULT_LANGUAGE: AppLanguage = 'en'
export const LANGUAGE_STORAGE_KEY = 'errata-language'

interface LanguageStorageReader {
  getItem: (key: string) => string | null
}

interface LanguageStorageWriter {
  setItem: (key: string, value: string) => void
}

const EN_MESSAGES = {
  'app.name': 'Errata',
  'settings.language.heading': 'Language',
  'settings.language.label': 'Interface language',
  'settings.language.description': 'Changes Errata interface text only. Story content and generation language are unchanged.',
  'settings.language.english': 'English',
  'settings.language.vietnamese': 'Tiếng Việt',
  'settings.about.heading': 'About',
  'settings.about.tagline': 'LLM-assisted writing, built around a fragment system.',
  'settings.about.documentation': 'Documentation',
  'settings.about.discord': 'Discord community',
  'settings.about.github': 'GitHub repository',
  'settings.about.releases': 'Releases and changelog',
  'settings.about.builtBy': 'Built by',
} as const

export type TranslationKey = keyof typeof EN_MESSAGES

const VI_MESSAGES: Partial<Record<TranslationKey, string>> = {
  'settings.language.heading': 'Ngôn ngữ',
  'settings.language.label': 'Ngôn ngữ giao diện',
  'settings.language.description': 'Chỉ thay đổi chữ trên giao diện Errata. Nội dung truyện và ngôn ngữ tạo văn bản không thay đổi.',
  'settings.language.english': 'English',
  'settings.language.vietnamese': 'Tiếng Việt',
  'settings.about.heading': 'Giới thiệu',
  'settings.about.tagline': 'Không gian viết có hỗ trợ LLM, được xây dựng quanh hệ thống fragment.',
  'settings.about.documentation': 'Tài liệu',
  'settings.about.discord': 'Cộng đồng Discord',
  'settings.about.github': 'Kho mã GitHub',
  'settings.about.releases': 'Bản phát hành và nhật ký thay đổi',
  'settings.about.builtBy': 'Được xây dựng bởi',
}

export function normalizeLanguage(value: string | null | undefined): AppLanguage {
  return value === 'vi' ? 'vi' : DEFAULT_LANGUAGE
}

export function readLanguagePreference(storage?: LanguageStorageReader | null): AppLanguage {
  if (!storage) return DEFAULT_LANGUAGE
  try {
    return normalizeLanguage(storage.getItem(LANGUAGE_STORAGE_KEY))
  } catch {
    return DEFAULT_LANGUAGE
  }
}

export function persistLanguagePreference(
  language: AppLanguage,
  storage?: LanguageStorageWriter | null,
): void {
  if (!storage) return
  try {
    storage.setItem(LANGUAGE_STORAGE_KEY, language)
  } catch {
    // Preference persistence is best-effort. The active session can still switch language.
  }
}

export function translate(language: AppLanguage, key: TranslationKey): string {
  if (language === 'vi') return VI_MESSAGES[key] ?? EN_MESSAGES[key]
  return EN_MESSAGES[key]
}

interface LanguageContextValue {
  language: AppLanguage
  setLanguage: (language: AppLanguage) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Start from English on both server and client to keep hydration deterministic.
  // The saved preference is applied immediately after mount, and a boot script in
  // __root.tsx sets <html lang> before hydration.
  const [language, setLanguageState] = useState<AppLanguage>(DEFAULT_LANGUAGE)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const saved = readLanguagePreference(window.localStorage)
    setLanguageState(saved)

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== LANGUAGE_STORAGE_KEY) return
      setLanguageState(normalizeLanguage(event.newValue))
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  useEffect(() => {
    if (typeof document !== 'undefined') document.documentElement.lang = language
  }, [language])

  const setLanguage = useCallback((next: AppLanguage) => {
    setLanguageState(next)
    if (typeof window !== 'undefined') {
      persistLanguagePreference(next, window.localStorage)
    }
  }, [])

  const t = useCallback((key: TranslationKey) => translate(language, key), [language])
  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within LanguageProvider')
  return context
}
