import React, { useLayoutEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { WheelPosition } from '../types'

interface WheelPositionCardProps {
  position: WheelPosition
  isSpare?: boolean
  selected: boolean
  onSelect: (position: WheelPosition) => void
}

export const WheelPositionCard: React.FC<WheelPositionCardProps> = ({ position, isSpare, selected, onSelect }) => {
  const { t } = useTranslation()
  const label = isSpare ? t('wheels.spare', { index: position.position_index - 18 }) : t('wheels.position', { index: position.position_index })
  const status = position.tire_serial ? t('wheels.statusInstalled') : t('wheels.statusEmpty')
  const serialRef = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const element = serialRef.current
    if (!element) {
      return
    }

    const fontSizes = [13, 12, 11, 10, 9]
    const maxLines = 2

    const adjustFontSize = () => {
      if (!element) {
        return
      }

      for (const size of fontSizes) {
        element.style.fontSize = `${size}px`
        element.style.lineHeight = '1.15'

        const computed = window.getComputedStyle(element)
        const lineHeight = parseFloat(computed.lineHeight)
        if (!lineHeight) {
          continue
        }
        const lineCount = Math.round(element.scrollHeight / lineHeight)
        if (lineCount <= maxLines) {
          return
        }
      }
      element.style.fontSize = `${fontSizes[fontSizes.length - 1]}px`
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
      <span className="hidden text-xs text-slate-400 sm:block">{status}</span>
    </button>
  )
}
