import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { WheelPosition } from '../types'
import { WheelPositionCard } from './WheelPositionCard'

interface WheelLayoutProps {
  positions: WheelPosition[]
  selectedId?: number
  onSelect: (position: WheelPosition) => void
}

const axleLayout: Array<{ left: Array<number | null>; right: Array<number | null> }> = [
  { left: [1, null], right: [null, 2] },
  { left: [3, 5], right: [4, 6] },
  { left: [7, 9], right: [8, 10] },
  { left: [11, 13], right: [12, 14] },
  { left: [15, 17], right: [16, 18] }
]

export const WheelLayout: React.FC<WheelLayoutProps> = ({ positions, selectedId, onSelect }) => {
  const { t } = useTranslation()
  const map = useMemo(() => new Map(positions.map((position) => [position.position_index, position])), [positions])
  const sparePositions = positions.filter((position) => position.position_index > 18)

  const renderCell = (index: number | null) => {
    if (!index) {
      return <div className="h-16 w-16" aria-hidden="true" />
    }
    const position = map.get(index)
    if (!position) {
      return <div className="h-16 w-16" aria-hidden="true" />
    }
    return (
      <WheelPositionCard
        key={position.id}
        position={position}
        selected={selectedId === position.position_index}
        onSelect={onSelect}
      />
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">{t('wheels.title')}</h2>
      <div className="grid grid-cols-[1fr_auto_1fr] gap-4">
        <div className="flex flex-col gap-4">
          {axleLayout.map((row, index) => (
            <div key={`left-${index}`} className="flex justify-end gap-3">
              {row.left.map((item, idx) => (
                <React.Fragment key={`left-${index}-${idx}`}>{renderCell(item)}</React.Fragment>
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-stretch">
          <div className="w-6 rounded-full bg-amber-300/80 dark:bg-amber-500/40 mx-auto" />
        </div>
        <div className="flex flex-col gap-4">
          {axleLayout.map((row, index) => (
            <div key={`right-${index}`} className="flex justify-start gap-3">
              {row.right.map((item, idx) => (
                <React.Fragment key={`right-${index}-${idx}`}>{renderCell(item)}</React.Fragment>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {sparePositions.map((position) => (
          <WheelPositionCard
            key={position.id}
            position={position}
            isSpare
            selected={selectedId === position.position_index}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}
