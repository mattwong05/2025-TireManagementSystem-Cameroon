import React from 'react'
import { useTranslation } from 'react-i18next'
import { WheelPosition } from '../types'
import { formatDateTime } from '../utils/date'

interface WheelDetailPanelProps {
  position?: WheelPosition
  onSerialChange: (serial: string) => void
  onInstall: () => void
  onRemove: () => void
  disabled?: boolean
  loading?: boolean
}

export const WheelDetailPanel: React.FC<WheelDetailPanelProps> = ({
  position,
  onSerialChange,
  onInstall,
  onRemove,
  disabled,
  loading
}) => {
  const { t } = useTranslation()

  if (!position) {
    return (
      <div className="rounded-xl bg-white dark:bg-slate-800 p-4 shadow-sm text-sm text-slate-500 dark:text-slate-400">
        {t('wheels.selectPrompt')}
      </div>
    )
  }

  const isSpare = position.position_index > 18
  const label = isSpare ? t('wheels.spare', { index: position.position_index - 18 }) : t('wheels.position', { index: position.position_index })

  return (
    <div className="rounded-xl bg-white dark:bg-slate-800 p-4 shadow-sm space-y-3">
      <div>
        <h3 className="text-lg font-semibold">{label}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {position.tire_serial ? t('wheels.statusInstalled') : t('wheels.statusEmpty')}
        </p>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <label className="block text-sm font-medium" htmlFor="tire-serial">
            {t('wheels.tireSerial')}
          </label>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {position.installed_at
              ? t('wheels.installedAt', { time: formatDateTime(position.installed_at) })
              : t('wheels.neverInstalled')}
          </span>
        </div>
        <input
          id="tire-serial"
          className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
          value={position.tire_serial || ''}
          onChange={(event) => onSerialChange(event.target.value)}
          placeholder={t('wheels.placeholder')}
          disabled={disabled || loading}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className="flex-1 rounded-md bg-amber-500 text-white py-2 font-semibold hover:bg-amber-600 disabled:opacity-60"
          onClick={onInstall}
          disabled={disabled || loading}
        >
          {loading ? t('wheels.installing') : t('wheels.install')}
        </button>
        <button
          type="button"
          className="flex-1 rounded-md border border-slate-300 dark:border-slate-700 py-2 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-60"
          onClick={onRemove}
          disabled={disabled || loading}
        >
          {loading ? t('wheels.removing') : t('wheels.remove')}
        </button>
      </div>
    </div>
  )
}
