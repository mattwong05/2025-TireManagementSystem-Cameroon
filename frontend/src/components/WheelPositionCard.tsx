import React, { useLayoutEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { WheelPosition } from '../types'
import { SPARE_START_INDEX } from '../constants'

interface WheelPositionCardProps {
  position: WheelPosition
  isSpare?: boolean
  selected: boolean
  onSelect: (position: WheelPosition) => void
}

export const WheelPositionCard: React.FC<WheelPositionCardProps> = ({ position, isSpare, selected, onSelect }) => {
  const { t } = useTranslation()
  const label = isSpare
    ? t('wheels.spare', { index: position.position_index - SPARE_START_INDEX + 1 })
    : t('wheels.position', { index: position.position_index })
  const serialRef = useRef<HTMLSpanElement>(null)
  const appliedFontSizeRef = useRef<number | null>(null)

  useLayoutEffect(() => {
    const element = serialRef.current
    if (!element) {
      return
    }

    appliedFontSizeRef.current = null

    const fontSizes = [13, 12, 11, 10, 9]
    const maxLines = 2
    const lineHeightValue = '1.15'

    const ensureBaseStyles = () => {
      if (!element) {
        return
      }
      if (element.style.lineHeight !== lineHeightValue) {
        element.style.lineHeight = lineHeightValue
      }
    }

    const applyFontSize = (size: number) => {
      if (!element) {
        return
      }
      ensureBaseStyles()
      if (appliedFontSizeRef.current === size) {
        return
      }
      element.style.fontSize = `${size}px`
      appliedFontSizeRef.current = size
    }

    const measureFits = () => {
      if (!element) {
        return true
      }
      const computed = window.getComputedStyle(element)
      const lineHeight = parseFloat(computed.lineHeight)
      if (!lineHeight) {
        return true
      }
      const maxHeight = lineHeight * maxLines
      return element.scrollHeight <= maxHeight + 0.5
    }

    const resolveCurrentIndex = () => {
      const target = appliedFontSizeRef.current
      if (target) {
        const index = fontSizes.indexOf(target)
        if (index !== -1) {
          return index
        }
      }

      const computed = parseFloat(window.getComputedStyle(element).fontSize)
      const nearestIndex = fontSizes.findIndex((size) => Math.abs(size - computed) < 0.51)
      if (nearestIndex !== -1) {
        return nearestIndex
      }

      const fallbackIndex = fontSizes.findIndex((size) => size <= computed)
      return fallbackIndex === -1 ? 0 : fallbackIndex
    }

    const adjustFontSize = () => {
      if (!element) {
        return
      }

      let index = resolveCurrentIndex()
      applyFontSize(fontSizes[index])

      while (index > 0) {
        applyFontSize(fontSizes[index - 1])
        if (measureFits()) {
          index -= 1
          continue
        }
        applyFontSize(fontSizes[index])
        break
      }

      while (!measureFits() && index < fontSizes.length - 1) {
        applyFontSize(fontSizes[index + 1])
        index += 1
      }
    }

    adjustFontSize()

    const resizeObserver = new ResizeObserver(() => {
      adjustFontSize()
    })
    resizeObserver.observe(element)

    return () => {
      resizeObserver.disconnect()
    }
  }, [position.tire_serial])

  return (
    <button
      type="button"
      onClick={() => onSelect(position)}
      className={`wheel-cell wheel-size ${selected ? 'selected' : ''}`}
    >
      <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">{label}</span>
      <span
        ref={serialRef}
        className="wheel-serial font-semibold text-slate-900 dark:text-slate-100 text-center break-words break-all px-1"
      >
        {position.tire_serial || '--'}
      </span>
    </button>
  )
}
