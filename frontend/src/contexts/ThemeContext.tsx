import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  mode: ThemeMode
  resolved: 'light' | 'dark'
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const THEME_KEY = 'tms_theme'

const getSystemTheme = (): 'light' | 'dark' =>
  window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

const applyThemeClass = (theme: 'light' | 'dark') => {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
    root.style.colorScheme = 'dark'
  } else {
    root.classList.remove('dark')
    root.style.colorScheme = 'light'
  }
}

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => (localStorage.getItem(THEME_KEY) as ThemeMode) || 'system')
  const [resolved, setResolved] = useState<'light' | 'dark'>(() => (mode === 'system' ? getSystemTheme() : mode))

  useEffect(() => {
    const listener = () => {
      if (mode === 'system') {
        const system = getSystemTheme()
        setResolved(system)
        applyThemeClass(system)
      }
    }
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [mode])

  useEffect(() => {
    const next = mode === 'system' ? getSystemTheme() : mode
    setResolved(next)
    applyThemeClass(next)
    localStorage.setItem(THEME_KEY, mode)
  }, [mode])

  const setMode = (value: ThemeMode) => {
    setModeState(value)
  }

  const value = useMemo(() => ({ mode, resolved, setMode }), [mode, resolved])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useThemeMode = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeProvider')
  }
  return context
}
