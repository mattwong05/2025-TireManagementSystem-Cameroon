const padToThree = (parts: Array<string | undefined>): string[] => {
  const result = parts.map((segment) => segment?.trim() ?? '')
  while (result.length < 3) {
    result.push('')
  }
  return result.slice(0, 3)
}

export const getPlateSegments = (plate: string): string[] => {
  const normalized = plate.trim().toUpperCase()
  if (!normalized) {
    return padToThree(['', '', ''])
  }

  const directParts = normalized.split(/\s+/).filter(Boolean)
  if (directParts.length >= 3) {
    return padToThree(directParts)
  }

  const compact = directParts.join('')
  const first = compact.slice(0, 4)
  const middle = compact.slice(4, 7)
  const last = compact.slice(7)

  return padToThree([first, middle, last])
}

export const normalizeLicensePlate = (value: string): string => value.replace(/\s+/g, '').toUpperCase()
