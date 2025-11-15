import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

const LANGUAGE_KEY = 'tms_language'

export const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation()
  const [language, setLanguage] = useState<string>(() => localStorage.getItem(LANGUAGE_KEY) || i18n.language)

  useEffect(() => {
    i18n.changeLanguage(language)
    localStorage.setItem(LANGUAGE_KEY, language)
  }, [language, i18n])

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="hidden sm:block text-slate-500 dark:text-slate-400">{t('language.label')}</span>
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-sm"
      >
        <option value="en">English</option>
        <option value="zh">中文</option>
      </select>
    </label>
  )
}
