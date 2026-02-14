interface SyncStatusProps {
  lastSyncAt: string | null
  activitiesImported: number
  connectedAt: string | null
  onSync: () => void
  isSyncing: boolean
}

export function SyncStatus({
  lastSyncAt,
  activitiesImported,
  connectedAt,
  onSync,
  isSyncing,
}: SyncStatusProps) {
  const formatRelativeTime = (dateStr: string): string => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-2">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        {connectedAt && (
          <>
            <dt className="text-gray-500">Connected</dt>
            <dd className="text-gray-700">
              {new Date(connectedAt).toLocaleDateString()}
            </dd>
          </>
        )}
        <dt className="text-gray-500">Activities</dt>
        <dd className="text-gray-700 font-medium">{activitiesImported}</dd>
        <dt className="text-gray-500">Last sync</dt>
        <dd className="text-gray-700">
          {lastSyncAt ? formatRelativeTime(lastSyncAt) : 'Never'}
        </dd>
      </dl>

      <button
        onClick={onSync}
        disabled={isSyncing}
        aria-busy={isSyncing}
        aria-label={isSyncing ? 'Syncing activities' : 'Sync now to import latest activities'}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-pink-50 text-pink-700 rounded-md hover:bg-pink-100 focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 focus-visible:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSyncing ? (
          <>
            <svg className="animate-spin h-3.5 w-3.5" aria-hidden="true" viewBox="0 0 24 24" fill="none">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Syncing...
          </>
        ) : (
          <>
            <svg
              className="h-3.5 w-3.5"
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
            Sync Now
          </>
        )}
      </button>
    </div>
  )
}
