export const formatDateTime = (value?: string | null, locale?: string) => {
  if (!value) {
    return null
  }
  try {
    const formatter = new Intl.DateTimeFormat(locale ?? undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
    return formatter.format(new Date(value))
  } catch (error) {
    return new Date(value).toLocaleString()
  }
}
