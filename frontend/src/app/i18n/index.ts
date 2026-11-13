import { watch } from 'vue'
import { createI18n } from 'vue-i18n'

import de from '@/locales/de.json'
import en from '@/locales/en.json'
import { locale } from '@/shared/i18n/locale'

const i18n = createI18n({
  legacy: false,
  locale: locale.value,
  fallbackLocale: 'en',
  messages: { de, en },
})

watch(
  locale,
  (value) => {
    i18n.global.locale.value = value
  },
  { flush: 'sync' },
)

export default i18n
