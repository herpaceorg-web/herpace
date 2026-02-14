import { useState } from 'react'
import type { ConnectedServiceDto } from '@/types/api'
import { SyncStatus } from './SyncStatus'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ServiceCardProps {
  service: ConnectedServiceDto
  onConnect: (platform: string) => void
  onDisconnect: (platform: string, deleteData: boolean) => void
  onSync: (platform: string) => void
  onToggleWomensHealth?: (platform: string, optIn: boolean) => void
  isSyncing?: boolean
}

const platformIcons: Record<string, string> = {
  Strava: '/icons/strava.svg',
  HealthConnect: '/icons/health-connect.svg',
  Garmin: '/icons/garmin.svg',
}

export function ServiceCard({
  service,
  onConnect,
  onDisconnect,
  onSync,
  onToggleWomensHealth,
  isSyncing = false,
}: ServiceCardProps) {
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false)

  const isConnected = service.status === 'Connected'
  const isTokenExpired = service.status === 'TokenExpired'
  const hasError = service.status === 'Error'

  return (
    <>
      <article className="rounded-lg border bg-white p-6 shadow-sm flex flex-col" aria-label={`${service.displayName} service`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {platformIcons[service.platform] && (
              <img
                src={platformIcons[service.platform]}
                alt=""
                aria-hidden="true"
                className="h-8 w-8"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            )}
            <h3 className="text-lg font-semibold">{service.displayName}</h3>
          </div>
          <StatusBadge status={service.status} />
        </div>

        {isConnected && (
          <div className="mb-4">
            <SyncStatus
              lastSyncAt={service.lastSyncAt ?? null}
              activitiesImported={service.activitiesImported}
              connectedAt={service.connectedAt ?? null}
              onSync={() => onSync(service.platform)}
              isSyncing={isSyncing}
            />
          </div>
        )}

        {isConnected && service.platform === 'Garmin' && onToggleWomensHealth && (
          <label className="flex items-center gap-3 mb-4 p-3 rounded-md bg-purple-50 border border-purple-100 cursor-pointer">
            <input
              type="checkbox"
              checked={service.womensHealthDataOptIn ?? false}
              onChange={(e) => onToggleWomensHealth(service.platform, e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-pink-500 focus:ring-pink-500"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">Cycle data sync</p>
              <p className="text-xs text-gray-500">
                Allow Garmin to share menstrual cycle data to improve training adjustments.
              </p>
            </div>
          </label>
        )}

        {isTokenExpired && (
          <div className="mb-4 rounded-md bg-yellow-50 border border-yellow-200 p-3" role="alert">
            <p className="text-sm text-yellow-900">
              Your access token has expired. Reconnect to resume syncing.
            </p>
          </div>
        )}

        {hasError && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3" role="alert">
            <p className="text-sm text-red-900">
              There was an error with this connection. Try reconnecting.
            </p>
          </div>
        )}

        <div className="flex gap-2 mt-auto pt-2">
          {isConnected ? (
            <button
              onClick={() => setShowDisconnectDialog(true)}
              aria-label={`Disconnect ${service.displayName}`}
              className="px-3 py-1.5 text-sm text-gray-500 rounded-md hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 focus-visible:outline-none transition-colors"
            >
              Disconnect
            </button>
          ) : service.available ? (
            <button
              onClick={() => onConnect(service.platform)}
              aria-label={`${isTokenExpired || hasError ? 'Reconnect' : 'Connect'} ${service.displayName}`}
              className="px-4 py-1.5 text-sm bg-pink-500 text-white rounded-md hover:bg-pink-600 focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 focus-visible:outline-none transition-colors"
            >
              {isTokenExpired || hasError ? 'Reconnect' : 'Connect'}
            </button>
          ) : (
            <span className="text-sm text-gray-400 italic">Coming soon</span>
          )}
        </div>
      </article>

      {/* Disconnect Confirmation Dialog */}
      <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect {service.displayName}?</DialogTitle>
            <DialogDescription>
              Choose what happens to your {service.activitiesImported} imported
              {service.activitiesImported === 1 ? ' activity' : ' activities'}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <button
              onClick={() => {
                setShowDisconnectDialog(false)
                onDisconnect(service.platform, false)
              }}
              aria-label="Disconnect and keep all imported data"
              className="w-full text-left rounded-lg border p-4 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 focus-visible:outline-none transition-colors"
            >
              <p className="font-medium text-gray-900">Keep imported data</p>
              <p className="text-sm text-gray-500 mt-1">
                Disconnect but keep all imported activities in HerPace. Matched training sessions remain linked.
              </p>
            </button>

            <button
              onClick={() => {
                setShowDisconnectDialog(false)
                onDisconnect(service.platform, true)
              }}
              aria-label="Disconnect and delete all imported data"
              className="w-full text-left rounded-lg border border-red-200 p-4 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:outline-none transition-colors"
            >
              <p className="font-medium text-red-600">Delete all imported data</p>
              <p className="text-sm text-gray-500 mt-1">
                Permanently delete all imported activities from {service.displayName}. Matched training sessions will be unlinked.
              </p>
            </button>
          </div>

          <DialogFooter>
            <button
              onClick={() => setShowDisconnectDialog(false)}
              className="px-4 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 focus-visible:outline-none transition-colors"
            >
              Cancel
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Connected: 'bg-green-100 text-green-800',
    NotConnected: 'bg-gray-100 text-gray-600',
    Disconnected: 'bg-gray-100 text-gray-600',
    TokenExpired: 'bg-yellow-100 text-yellow-900',
    Error: 'bg-red-100 text-red-900',
  }

  const labels: Record<string, string> = {
    Connected: 'Connected',
    NotConnected: 'Not Connected',
    Disconnected: 'Disconnected',
    TokenExpired: 'Token Expired',
    Error: 'Error',
  }

  return (
    <span
      role="status"
      className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[status] ?? styles.NotConnected}`}
    >
      {labels[status] ?? status}
    </span>
  )
}
