import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Vehicle } from '../types'
import { getPlateSegments, normalizeLicensePlate } from '../utils/licensePlate'

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
    const normalizedPlate = normalizeLicensePlate(licensePlate)
    if (!normalizedPlate) {
      return
    }
    setCreating(true)
    try {
      const normalizedDescription = description.trim()
      await onCreate(normalizedPlate, normalizedDescription ? normalizedDescription : undefined)
      setLicensePlate('')
      setDescription('')
      setError(null)
    } catch (err) {
      setError('Failed to add vehicle')
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      {!collapsed && <div className="fixed inset-0 z-40 bg-black/45 lg:hidden" onClick={onToggleCollapsed} />}
      <aside className="lg:sticky lg:top-6 lg:h-fit">
        <div
          className={`fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-slate-200 bg-white dark:bg-slate-900 p-5 shadow-2xl transition-all duration-300 ease-out lg:relative lg:inset-auto lg:max-h-full lg:rounded-2xl lg:border lg:border-slate-200 dark:lg:border-slate-700 lg:shadow-sm lg:p-4 lg:w-72 ${
            collapsed ? 'translate-y-full opacity-0 pointer-events-none lg:translate-y-0 lg:opacity-100 lg:pointer-events-auto' : 'translate-y-0 opacity-100'
          }`}
        >
          <div className="mx-auto flex w-full max-w-md flex-col gap-5">
            <div className="flex items-center justify-between lg:hidden">
              <h2 className="text-base font-semibold">{t('vehicles.title')}</h2>
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
                onChange={(event) => onSearchChange(normalizeLicensePlate(event.target.value))}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                placeholder={t('vehicles.plateFormat')}
              />
            </div>
            <div className="max-h-[280px] overflow-y-auto pr-1">
              {vehicles.length === 0 ? (
                <p className="text-sm text-slate-500">{t('vehicles.empty')}</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 lg:grid-cols-2 auto-rows-[minmax(0,1fr)]">
                  {vehicles.map((vehicle) => {
                    const segments = getPlateSegments(vehicle.license_plate)

                    return (
                      <button
                        key={vehicle.id}
                        type="button"
                        onClick={() => {
                          onSelect(vehicle)
                          if (window.innerWidth < 1024) {
                            onToggleCollapsed()
                          }
                        }}
                        className="w-full h-full"
                      >
                        <div className={`plate-card ${vehicle.id === selectedId ? 'active' : ''}`}>
                          {segments.map((segment, index) => (
                            <span key={`${vehicle.id}-${index}`} className="plate-segment">
                              {segment || '\u00A0'}
                            </span>
                          ))}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            <form onSubmit={handleCreate} className="space-y-3 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium" htmlFor="plate-input">
                  {t('vehicles.plateLabel')}
                </label>
                <input
                  id="plate-input"
                  value={licensePlate}
                  onChange={(event) => setLicensePlate(normalizeLicensePlate(event.target.value))}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  placeholder="AB 123 CD"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium" htmlFor="description-input">
                  {t('vehicles.description')}
                </label>
                <input
                  id="description-input"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={creating}
                className="w-full rounded-lg bg-slate-900 text-white py-2 font-semibold hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 disabled:opacity-60"
              >
                {creating ? '...' : t('vehicles.add')}
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  )
}
