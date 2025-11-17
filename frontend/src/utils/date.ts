const normalizeUtcString = (value: string) => {
  const hasTimeZoneSuffix = /([zZ]|[+-]\d{2}:?\d{2})$/.test(value)
  return hasTimeZoneSuffix ? value : `${value}Z`
}

export const formatDateTime = (value?: string | null, locale?: string) => {
  if (!value) {
    return null
  }
  try {
    const normalized = normalizeUtcString(value)
    const date = new Date(normalized)
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const formatter = new Intl.DateTimeFormat(locale ?? undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone
    })
    return formatter.format(date)
  } catch (error) {
    return new Date(value).toLocaleString()
  }
}
