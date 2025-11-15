import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en/translation.json'
import zh from './locales/zh/translation.json'

const language = navigator.language.startsWith('zh') ? 'zh' : 'en'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh }
    },
    lng: language,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  })

export default i18n
