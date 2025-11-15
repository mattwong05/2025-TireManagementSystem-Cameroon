import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { WheelPosition } from '../types'
import { WheelPositionCard } from './WheelPositionCard'
import { getPlateSegments } from '../utils/licensePlate'

interface WheelLayoutProps {
  positions: WheelPosition[]
  selectedId?: number
  vehiclePlate?: string
  onSelect: (position: WheelPosition) => void
}

const axleLayout: Array<{ left: Array<number | null>; right: Array<number | null> }> = [
  { left: [null, 2], right: [1, null] },
  { left: [3, 5], right: [4, 6] },
  { left: [7, 9], right: [8, 10] },
  { left: [11, 13], right: [12, 14] },
  { left: [15, 17], right: [16, 18] }
]

export const WheelLayout: React.FC<WheelLayoutProps> = ({ positions, selectedId, vehiclePlate, onSelect }) => {
  const { t } = useTranslation()
  const map = useMemo(() => new Map(positions.map((position) => [position.position_index, position])), [positions])
  const sparePositions = positions.filter((position) => position.position_index > 18)
  const plateSegments = useMemo(() => {
    if (!vehiclePlate) {
      return null
    }
    return getPlateSegments(vehiclePlate)
  }, [vehiclePlate])

  const renderCell = (index: number | null) => {
    if (!index) {
      return <div className="wheel-size" aria-hidden="true" />
    }
    const position = map.get(index)
    if (!position) {
      return <div className="wheel-size" aria-hidden="true" />
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
    <div className="space-y-4 sm:space-y-6">
      {plateSegments && (
        <div className="lg:hidden flex justify-center pb-1">
          <div className="mini-plate-card">
            {plateSegments.map((segment, index) => (
              <span key={`layout-plate-${index}`} className="mini-plate-segment">
                {segment || '\u00A0'}
              </span>
            ))}
          </div>
        </div>
      )}
      <h2 className="text-lg font-semibold">{t('wheels.title')}</h2>
      <div className="space-y-1">
        <div className="overflow-x-auto pb-2">
          <div className="mx-auto min-w-fit px-2">
            <div className="flex items-stretch justify-center gap-2.5 sm:gap-6">
              <div className="flex flex-col items-end gap-1 sm:gap-3.5">
                {axleLayout.map((row, index) => (
                  <div key={`left-${index}`} className="flex justify-end gap-1.5 sm:gap-3.5">
                    {row.left.map((item, idx) => (
                      <React.Fragment key={`left-${index}-${idx}`}>{renderCell(item)}</React.Fragment>
                    ))}
                  </div>
                ))}
              </div>
              <div className="flex items-center">
                <div className="mx-1 sm:mx-1.5 h-full w-1 sm:w-1.5 rounded-full bg-amber-300/80 dark:bg-amber-500/40" />
              </div>
              <div className="flex flex-col items-start gap-1 sm:gap-3.5">
                {axleLayout.map((row, index) => (
                  <div key={`right-${index}`} className="flex justify-start gap-1.5 sm:gap-3.5">
                    {row.right.map((item, idx) => (
                      <React.Fragment key={`right-${index}-${idx}`}>{renderCell(item)}</React.Fragment>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {sparePositions.length > 0 && (
          <div className="flex items-center justify-center gap-2 sm:gap-4 px-6 sm:px-10">
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
        )}
      </div>
    </div>
  )
}
