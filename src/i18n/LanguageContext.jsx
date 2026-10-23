import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { DICT } from './dictionary'

/**
 * LanguageContext — dwibahasa global (BM / EN).
 *
 * Penggunaan:
 *   <LanguageProvider> ... </LanguageProvider>
 *   const { lang, setLang, t } = useLang()
 *   t('nav.home')            -> "Laman Utama" | "Home"
 *   t('radar.count', {n:5})  -> "5 lead dipaparkan" | "5 leads shown"
 *
 * Pilihan disimpan dalam localStorage['fsg-lang'] dan dipakai sebelum
 * cat pertama (skrip kecil dalam index.html) supaya tiada kilat teks
 * bahasa yang salah.
 *
 * Jika kunci tiada dalam bahasa aktif, ia jatuh balik ke BM dan
 * menulis amaran dalam mod pembangunan — lebih baik nampak daripada
 * ruang kosong di skrin.
 */
const LanguageContext = createContext(null)

const STORAGE_KEY = 'fsg-lang'
const DEFAULT_LANG = 'bm'

function readStored() {
  if (typeof window === 'undefined') return DEFAULT_LANG
  try {
    const v = window.localStorage.getItem(STORAGE_KEY)
    return v === 'en' || v === 'bm' ? v : DEFAULT_LANG
  } catch {
    return DEFAULT_LANG
  }
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(readStored)

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang === 'bm' ? 'ms' : 'en')
  }, [lang])

  const setLang = useCallback((next) => {
    if (next !== 'bm' && next !== 'en') return
    setLangState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* mod peribadi — pilihan tidak kekal, itu boleh diterima */
    }
  }, [])

  const toggleLang = useCallback(() => {
    setLang(lang === 'bm' ? 'en' : 'bm')
  }, [lang, setLang])

  /**
   * t(key, vars) — terjemah kunci, dengan penggantian {placeholder}.
   */
  const t = useCallback(
    (key, vars) => {
      const table = DICT[lang] || DICT[DEFAULT_LANG]
      let s = table[key]

      if (s === undefined) {
        // Jatuh balik ke BM, dan beritahu dalam mod pembangunan.
        s = DICT[DEFAULT_LANG][key]
        if (s === undefined) {
          if (import.meta.env?.DEV) {
            console.warn(`[i18n] kunci tiada dalam kedua-dua bahasa: ${key}`)
          }
          return key
        }
        if (import.meta.env?.DEV) {
          console.warn(`[i18n] kunci "${key}" tiada dalam "${lang}" — guna BM`)
        }
      }

      if (vars) {
        s = String(s).replace(/\{(\w+)\}/g, (m, name) =>
          vars[name] !== undefined ? String(vars[name]) : m
        )
      }
      return s
    },
    [lang]
  )

  const value = useMemo(
    () => ({ lang, setLang, toggleLang, t, isBM: lang === 'bm' }),
    [lang, setLang, toggleLang, t]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLang() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLang must be used inside <LanguageProvider>')
  return ctx
}
