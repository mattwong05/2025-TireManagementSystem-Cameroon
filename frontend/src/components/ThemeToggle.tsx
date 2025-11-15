import React from 'react'
import { useTranslation } from 'react-i18next'
import { useThemeMode } from '../contexts/ThemeContext'

export const ThemeToggle: React.FC = () => {
  const { mode, setMode } = useThemeMode()
  const { t } = useTranslation()

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="hidden sm:block text-slate-500 dark:text-slate-400">{t('theme.label')}</span>
      <select
        value={mode}
        onChange={(event) => setMode(event.target.value as typeof mode)}
        className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-sm"
      >
        <option value="system">{t('theme.system')}</option>
        <option value="light">{t('theme.light')}</option>
        <option value="dark">{t('theme.dark')}</option>
      </select>
    </label>
  )
}
