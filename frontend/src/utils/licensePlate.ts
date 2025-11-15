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

  if (directParts.length === 2) {
    const [first, second] = directParts
    if (second.length <= 3) {
      return padToThree([first, second])
    }
    return padToThree([first, second.slice(0, 3), second.slice(3)])
  }

  const compact = normalized.replace(/\s+/g, '')
  if (compact.length <= 3) {
    return padToThree([compact])
  }

  const region = compact.slice(0, 2)
  const rest = compact.slice(2)
  const digitsMatch = rest.match(/^(\d{1,4})(.*)$/)
  if (digitsMatch) {
    const [, digits, suffix] = digitsMatch
    return padToThree([region, digits, suffix])
  }

  const baseSize = Math.ceil(compact.length / 3)
  return padToThree([
    compact.slice(0, baseSize),
    compact.slice(baseSize, baseSize * 2),
    compact.slice(baseSize * 2)
  ])
}

export const normalizeLicensePlate = (value: string): string => value.replace(/\s+/g, '').toUpperCase()
