import React from 'react'
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

  return (
    <button
      type="button"
      onClick={() => onSelect(position)}
      className={`wheel-cell wheel-size ${selected ? 'selected' : ''}`}
    >
      <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">{label}</span>
      <span className="text-[0.7rem] sm:text-sm font-semibold text-slate-900 dark:text-slate-100 text-center leading-tight break-words break-all px-1">
        {position.tire_serial || '--'}
      </span>
      <span className="text-xs text-slate-400">{status}</span>
    </button>
  )
}
