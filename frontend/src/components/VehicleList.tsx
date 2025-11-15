import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Vehicle } from '../types'

interface VehicleListProps {
  vehicles: Vehicle[]
  selectedId?: number
  search: string
  onSearchChange: (value: string) => void
  onSelect: (vehicle: Vehicle) => void
  onCreate: (plate: string, description?: string) => Promise<void>
  collapsed: boolean
  onToggleCollapsed: () => void
}

export const VehicleList: React.FC<VehicleListProps> = ({
  vehicles,
  selectedId,
  search,
  onSearchChange,
  onSelect,
  onCreate,
  collapsed,
  onToggleCollapsed
}) => {
  const { t } = useTranslation()
  const [licensePlate, setLicensePlate] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!licensePlate.trim()) {
      return
    }
    setCreating(true)
    try {
      await onCreate(licensePlate.toUpperCase(), description)
      setLicensePlate('')
      setDescription('')
      setError(null)
    } catch (err) {
      setError('Failed to add vehicle')
    } finally {
      setCreating(false)
    }
  }

  const overlayClasses = collapsed
    ? 'hidden lg:block'
    : 'fixed inset-0 z-40 bg-black/40 lg:static lg:bg-transparent lg:block'

  return (
    <div className={overlayClasses}>
      <div className="absolute inset-0" hidden={collapsed} onClick={onToggleCollapsed} />
      <div className={`relative z-50 lg:z-auto max-h-full lg:static ${collapsed ? 'hidden lg:block' : 'block'}`}>
        <div className="w-80 max-w-full lg:w-full h-full lg:h-auto lg:sticky lg:top-6 space-y-4 p-4 lg:p-0 bg-white dark:bg-slate-900 lg:bg-transparent lg:dark:bg-transparent shadow-lg lg:shadow-none rounded-r-2xl lg:rounded-none">
          <div className="flex items-center justify-between lg:hidden">
            <h2 className="text-lg font-semibold">{t('vehicles.title')}</h2>
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="rounded-md border border-slate-300 dark:border-slate-700 px-3 py-1 text-sm"
            >
              ✕
            </button>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="vehicle-search">
              {t('vehicles.search')}
            </label>
            <input
              id="vehicle-search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
              placeholder={t('vehicles.plateFormat')}
            />
          </div>
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {vehicles.length === 0 && <p className="text-sm text-slate-500">{t('vehicles.empty')}</p>}
            {vehicles.map((vehicle) => (
              <button
                key={vehicle.id}
                type="button"
                onClick={() => {
                  onSelect(vehicle)
                  if (window.innerWidth < 1024) {
                    onToggleCollapsed()
                  }
                }}
                className="w-full"
              >
                <div className={`plate-card ${vehicle.id === selectedId ? 'active' : ''}`}>
                  {vehicle.license_plate}
                </div>
              </button>
            ))}
          </div>
          <form onSubmit={handleCreate} className="space-y-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-3">
            <div>
              <label className="block text-sm font-medium" htmlFor="plate-input">
                {t('vehicles.add')}
              </label>
              <input
                id="plate-input"
                value={licensePlate}
                onChange={(event) => setLicensePlate(event.target.value)}
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
                placeholder="AB 123 CD"
              />
            </div>
            <div>
              <label className="block text-sm font-medium" htmlFor="description-input">
                {t('vehicles.description')}
              </label>
              <input
                id="description-input"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={creating}
              className="w-full rounded-md bg-slate-900 text-white py-2 font-semibold hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 disabled:opacity-60"
            >
              {creating ? '...' : t('vehicles.add')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
