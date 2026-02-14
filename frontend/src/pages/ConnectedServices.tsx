import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useToast } from '@/contexts/ToastContext'
import { fitnessTrackerApi } from '@/lib/api-client'
import type { ConnectedServiceDto } from '@/types/api'
import { ServiceCard } from '@/components/fitness-tracker/ServiceCard'

/**
 * Connected Services page — shows available fitness trackers and their connection status.
 * Uses ServiceCard and SyncStatus components for full management UI.
 */
export function ConnectedServices() {
  const [services, setServices] = useState<ConnectedServiceDto[]>([])
  const [loading, setLoading] = useState(true)
  const [syncingPlatform, setSyncingPlatform] = useState<string | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const toast = useToast()

  // Handle OAuth callback query params
  useEffect(() => {
    const connected = searchParams.get('connected')
    const error = searchParams.get('error')
    const platform = searchParams.get('platform')

    if (connected) {
      const name = connected.charAt(0).toUpperCase() + connected.slice(1)
      toast.success(`${name} connected`, 'Your account has been linked and activities are being imported.')
      setSearchParams({}, { replace: true })
    } else if (error) {
      const name = platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : 'Service'
      if (error === 'denied') {
        toast.warning(`${name} connection cancelled`, 'You denied access. You can try connecting again anytime.')
      } else {
        toast.error(`${name} connection failed`, 'Something went wrong during authentication. Please try again.')
      }
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams, toast])

  useEffect(() => {
    loadServices()
  }, [])

  const loadServices = async () => {
    try {
      setLoading(true)
      const result = await fitnessTrackerApi.getConnectedServices()
      setServices(result.services)
    } catch {
      toast.error('Failed to load services', 'Could not fetch connected services. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async (platform: string) => {
    try {
      if (platform === 'Strava') {
        const result = await fitnessTrackerApi.connectStrava()
        window.location.href = result.authorizationUrl
      } else if (platform === 'Garmin') {
        const result = await fitnessTrackerApi.connectGarmin()
        window.location.href = result.authorizationUrl
      }
    } catch {
      toast.error('Connection failed', 'Could not initiate connection. Please try again.')
    }
  }

  const handleDisconnect = async (platform: string, deleteData: boolean) => {
    try {
      const result = await fitnessTrackerApi.disconnectService(platform, deleteData)
      if (result.dataDeleted) {
        toast.success(`${platform} disconnected`, 'All imported data has been deleted.')
      } else {
        toast.success(`${platform} disconnected`, `${result.activitiesRetained} activities have been kept.`)
      }
      loadServices()
    } catch {
      toast.error('Disconnect failed', 'Could not disconnect the service. Please try again.')
    }
  }

  const handleToggleWomensHealth = async (platform: string, optIn: boolean) => {
    try {
      await fitnessTrackerApi.updateWomensHealthOptIn(platform, optIn)
      setServices((prev) =>
        prev.map((s) =>
          s.platform === platform ? { ...s, womensHealthDataOptIn: optIn } : s
        )
      )
      toast.success(
        optIn ? 'Cycle data sync enabled' : 'Cycle data sync disabled',
        optIn
          ? 'Garmin will share menstrual cycle data to improve training adjustments.'
          : 'Garmin will no longer share cycle data.'
      )
    } catch {
      toast.error('Update failed', 'Could not update the setting. Please try again.')
    }
  }

  const handleSync = async (platform: string) => {
    try {
      setSyncingPlatform(platform)
      const result = await fitnessTrackerApi.triggerSync(platform)
      toast.success('Sync started', result.message)
      // Reload services after a short delay to show updated sync time
      setTimeout(() => loadServices(), 3000)
    } catch {
      toast.error('Sync failed', 'Could not trigger sync. Please try again later.')
    } finally {
      setSyncingPlatform(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" role="status" aria-label="Loading services">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
      </div>
    )
  }

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Connected Services</h1>
        <p className="text-gray-500 mt-1">Link your fitness trackers to automatically import runs.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" role="region" aria-label="Available fitness services">
        {services.map((service) => (
          <ServiceCard
            key={service.platform}
            service={service}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onSync={handleSync}
            onToggleWomensHealth={handleToggleWomensHealth}
            isSyncing={syncingPlatform === service.platform}
          />
        ))}
      </div>
    </main>
  )
}
