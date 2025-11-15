import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { apiClient } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { Vehicle, VehicleDetail, WheelPosition } from '../types'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ThemeToggle } from './ThemeToggle'
import { VehicleList } from './VehicleList'
import { WheelLayout } from './WheelLayout'
import { WheelDetailPanel } from './WheelDetailPanel'
import { normalizeLicensePlate } from '../utils/licensePlate'

interface FeedbackMessage {
  type: 'success' | 'error'
  message: string
}

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [search, setSearch] = useState('')
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [detail, setDetail] = useState<VehicleDetail | null>(null)
  const [positions, setPositions] = useState<WheelPosition[]>([])
  const [selectedPositionIndex, setSelectedPositionIndex] = useState<number | undefined>(undefined)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null)
  const [lastUpdatedMap, setLastUpdatedMap] = useState<Record<number, string>>({})
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [editingVehicle, setEditingVehicle] = useState(false)
  const [vehicleForm, setVehicleForm] = useState({ license_plate: '', description: '' })
  const [vehicleSubmitting, setVehicleSubmitting] = useState(false)
  const [vehicleDeleting, setVehicleDeleting] = useState(false)

  const fetchVehicles = useCallback(async (term?: string) => {
    const { data } = await apiClient.get<Vehicle[]>('/vehicles', { params: term ? { search: term } : {} })
    const normalizedVehicles = data.map((item) => ({
      ...item,
      license_plate: normalizeLicensePlate(item.license_plate)
    }))
    setVehicles(normalizedVehicles)
    setSelectedVehicle((previous) => {
      if (previous) {
        const found = normalizedVehicles.find((item) => item.id === previous.id)
        if (found) {
          return found
        }
      }
      return normalizedVehicles[0] ?? null
    })
  }, [])

  const fetchVehicleDetail = useCallback(
    async (vehicleId: number) => {
      const { data } = await apiClient.get<VehicleDetail>(`/vehicles/${vehicleId}`)
      const normalizedDetail: VehicleDetail = {
        ...data,
        license_plate: normalizeLicensePlate(data.license_plate)
      }
      setDetail(normalizedDetail)
      setPositions(normalizedDetail.wheel_positions)
      setSelectedPositionIndex(normalizedDetail.wheel_positions[0]?.position_index)
    },
    []
  )

  useEffect(() => {
    fetchVehicles().catch(() => setFeedback({ type: 'error', message: t('notifications.error') }))
  }, [fetchVehicles, t])

  useEffect(() => {
    if (selectedVehicle) {
      fetchVehicleDetail(selectedVehicle.id).catch(() => setFeedback({ type: 'error', message: t('notifications.error') }))
    }
  }, [selectedVehicle, fetchVehicleDetail, t])

  useEffect(() => {
    if (!selectedVehicle) {
      setDetail(null)
      setPositions([])
      setSelectedPositionIndex(undefined)
    }
  }, [selectedVehicle])

  useEffect(() => {
    if (detail) {
      setVehicleForm({
        license_plate: normalizeLicensePlate(detail.license_plate),
        description: detail.description ?? ''
      })
    } else {
      setVehicleForm({ license_plate: '', description: '' })
    }
    setEditingVehicle(false)
  }, [detail])

  useEffect(() => {
    const handle = setTimeout(() => {
      fetchVehicles(search).catch(() => setFeedback({ type: 'error', message: t('notifications.error') }))
    }, 350)
    return () => clearTimeout(handle)
  }, [search, fetchVehicles, t])

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [feedback])

  const selectedPosition = useMemo(
    () => positions.find((position) => position.position_index === selectedPositionIndex),
    [positions, selectedPositionIndex]
  )

  const handleSelectVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setSidebarCollapsed(true)
    setEditingVehicle(false)
  }

  const handleCreateVehicle = async (plate: string, description?: string) => {
    const normalizedPlate = normalizeLicensePlate(plate)
    const { data } = await apiClient.post<VehicleDetail>('/vehicles', {
      license_plate: normalizedPlate,
      description
    })
    await fetchVehicles(search)
    setSelectedVehicle({
      id: data.id,
      license_plate: normalizeLicensePlate(data.license_plate),
      description: data.description
    })
    setFeedback({ type: 'success', message: t('notifications.vehicleCreated') })
  }

  const handlePositionUpdate = (positionIndex: number, serial: string) => {
    setPositions((prev) =>
      prev.map((item) =>
        item.position_index === positionIndex
          ? { ...item, tire_serial: serial ? serial.toUpperCase() : null }
          : item
      )
    )
  }

  const handleVehicleFieldChange = (field: 'license_plate' | 'description', value: string) => {
    if (field === 'license_plate') {
      setVehicleForm((prev) => ({ ...prev, license_plate: normalizeLicensePlate(value) }))
      return
    }
    setVehicleForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleUpdateVehicle = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!detail) return
    setVehicleSubmitting(true)
    try {
      const payload = {
        license_plate: normalizeLicensePlate(vehicleForm.license_plate),
        description: vehicleForm.description.trim() || null
      }
      const { data } = await apiClient.put<VehicleDetail>(`/vehicles/${detail.id}`, payload)
      const normalizedDetail: VehicleDetail = {
        ...data,
        license_plate: normalizeLicensePlate(data.license_plate)
      }
      await fetchVehicles(search)
      setSelectedVehicle({
        id: normalizedDetail.id,
        license_plate: normalizedDetail.license_plate,
        description: normalizedDetail.description
      })
      setDetail(normalizedDetail)
      setFeedback({ type: 'success', message: t('notifications.vehicleUpdated') })
      setEditingVehicle(false)
    } catch (error) {
      setFeedback({ type: 'error', message: t('notifications.error') })
    } finally {
      setVehicleSubmitting(false)
    }
  }

  const handleDeleteVehicle = async () => {
    if (!detail) return
    if (!window.confirm(t('vehicles.deleteConfirm', { plate: detail.license_plate }))) {
      return
    }
    setVehicleDeleting(true)
    try {
      await apiClient.delete(`/vehicles/${detail.id}`)
      await fetchVehicles(search)
      setFeedback({ type: 'success', message: t('notifications.vehicleDeleted') })
    } catch (error) {
      setFeedback({ type: 'error', message: t('notifications.error') })
    } finally {
      setVehicleDeleting(false)
    }
  }

  const handleRemove = (positionIndex: number) => {
    setPositions((prev) =>
      prev.map((item) =>
        item.position_index === positionIndex ? { ...item, tire_serial: null } : item
      )
    )
  }

  const handleSave = async () => {
    if (!detail) return
    setSaving(true)
    try {
      const payload = {
        positions: positions.map((item) => ({
          position_index: item.position_index,
          tire_serial: item.tire_serial || null
        }))
      }
      const { data } = await apiClient.post<VehicleDetail>(
        `/vehicles/${detail.id}/wheel-positions/bulk`,
        payload
      )
      const normalizedDetail: VehicleDetail = {
        ...data,
        license_plate: normalizeLicensePlate(data.license_plate)
      }
      setDetail(normalizedDetail)
      setPositions(normalizedDetail.wheel_positions)
      setFeedback({ type: 'success', message: t('notifications.saved') })
      setLastUpdatedMap((prev) => ({ ...prev, [detail.id]: new Date().toLocaleString() }))
    } catch (error) {
      setFeedback({ type: 'error', message: t('notifications.error') })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-col">
            <span className="text-sm text-slate-500 dark:text-slate-400">{t('dashboard.greeting', { name: user?.username })}</span>
            <h1 className="text-xl font-semibold">{t('app.title')}</h1>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            <button
              type="button"
              onClick={logout}
              className="rounded-md border border-slate-300 dark:border-slate-700 px-3 py-1 text-sm"
            >
              {t('dashboard.logout')}
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-4 sm:py-6">
        {feedback && (
          <div
            className={`mb-4 rounded-md px-4 py-2 text-sm ${
              feedback.type === 'success'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300'
                : 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-300'
            }`}
          >
            {feedback.message}
          </div>
        )}
        <div className="mb-4 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarCollapsed(false)}
            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-semibold"
          >
            {t('wheels.mobileToggle')}
          </button>
        </div>
        <div className="grid gap-3 sm:gap-4 lg:grid-cols-[280px,1fr] lg:gap-6">
          <VehicleList
            vehicles={vehicles}
            selectedId={selectedVehicle?.id}
            search={search}
            onSearchChange={setSearch}
            onSelect={handleSelectVehicle}
            onCreate={handleCreateVehicle}
            collapsed={sidebarCollapsed}
            onToggleCollapsed={() => setSidebarCollapsed((value) => !value)}
          />
          <div className="space-y-4 sm:space-y-5">
            {detail && (
              <div className="rounded-xl bg-white dark:bg-slate-800 p-4 shadow-sm space-y-3 sm:space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{detail.license_plate}</h2>
                    {detail.description && (
                      <p className="text-sm text-slate-500 dark:text-slate-400">{detail.description}</p>
                    )}
                    {lastUpdatedMap[detail.id] && (
                      <p className="text-xs text-slate-400">{t('dashboard.lastUpdated', { time: lastUpdatedMap[detail.id] })}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingVehicle((value) => !value)}
                      className="rounded-md border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm font-semibold"
                    >
                      {editingVehicle ? t('vehicles.cancelEdit') : t('vehicles.edit')}
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="rounded-md bg-amber-500 text-white px-4 py-2 font-semibold hover:bg-amber-600 disabled:opacity-60"
                    >
                      {saving ? t('dashboard.saving') : t('dashboard.save')}
                    </button>
                  </div>
                </div>
                {editingVehicle && (
                  <form className="space-y-3" onSubmit={handleUpdateVehicle}>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium" htmlFor="vehicle-plate">
                          {t('vehicles.plateLabel')}
                        </label>
                        <input
                          id="vehicle-plate"
                          value={vehicleForm.license_plate}
                          onChange={(event) => handleVehicleFieldChange('license_plate', event.target.value)}
                          className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
                          placeholder="AB 123 CD"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium" htmlFor="vehicle-description">
                          {t('vehicles.description')}
                        </label>
                        <input
                          id="vehicle-description"
                          value={vehicleForm.description}
                          onChange={(event) => handleVehicleFieldChange('description', event.target.value)}
                          className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="submit"
                        disabled={vehicleSubmitting}
                        className="flex-1 rounded-md bg-slate-900 text-white py-2 font-semibold hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 disabled:opacity-60"
                      >
                        {vehicleSubmitting ? t('vehicles.updating') : t('vehicles.update')}
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteVehicle}
                        disabled={vehicleDeleting}
                        className="flex-1 rounded-md border border-red-400 text-red-600 dark:border-red-500 dark:text-red-300 py-2 font-semibold hover:bg-red-50 dark:hover:bg-red-500/20 disabled:opacity-60"
                      >
                        {vehicleDeleting ? t('vehicles.deleting') : t('vehicles.delete')}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
            <div className="grid lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)] gap-6">
              <div className="rounded-xl bg-white dark:bg-slate-800 p-4 shadow-sm">
                <WheelLayout
                  positions={positions}
                  selectedId={selectedPositionIndex}
                  vehiclePlate={detail?.license_plate}
                  onSelect={(position) => setSelectedPositionIndex(position.position_index)}
                />
              </div>
              <WheelDetailPanel
                position={selectedPosition}
                onUpdate={(serial) => {
                  if (!selectedPosition) return
                  handlePositionUpdate(selectedPosition.position_index, serial)
                }}
                onRemove={() => {
                  if (!selectedPosition) return
                  handleRemove(selectedPosition.position_index)
                }}
                disabled={!detail}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
