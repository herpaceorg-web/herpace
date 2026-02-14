import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '@/contexts/ToastContext'
import { fitnessTrackerApi } from '@/lib/api-client'
import type { ImportedActivitySummaryDto, PaginationInfo } from '@/types/api'

function formatDistance(meters?: number): string {
  if (!meters) return '-'
  return `${(meters / 1000).toFixed(2)} km`
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '-'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatPace(secondsPerKm?: number): string {
  if (!secondsPerKm) return '-'
  const m = Math.floor(secondsPerKm / 60)
  const s = Math.round(secondsPerKm % 60)
  return `${m}:${s.toString().padStart(2, '0')} /km`
}

const platformIcons: Record<string, string> = {
  Strava: '\u{1F3C3}',
  HealthConnect: '\u{2764}\u{FE0F}',
  Garmin: '\u{231A}'
}

export function ImportedActivities() {
  const [activities, setActivities] = useState<ImportedActivitySummaryDto[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [platformFilter, setPlatformFilter] = useState<string>('')
  const toast = useToast()

  useEffect(() => {
    loadActivities()
  }, [page, platformFilter])

  const loadActivities = async () => {
    try {
      setLoading(true)
      const result = await fitnessTrackerApi.getImportedActivities({
        page,
        pageSize: 20,
        platform: platformFilter || undefined
      })
      setActivities(result.activities)
      setPagination(result.pagination)
    } catch {
      toast.error('Failed to load activities', 'Could not fetch imported activities.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Imported Activities</h1>
          <p className="text-gray-500 mt-1">
            {pagination ? `${pagination.totalItems} total runs` : 'Your imported runs from connected services.'}
          </p>
        </div>
        <select
          value={platformFilter}
          onChange={(e) => { setPlatformFilter(e.target.value); setPage(1) }}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
        >
          <option value="">All Platforms</option>
          <option value="Strava">Strava</option>
          <option value="HealthConnect">Health Connect</option>
          <option value="Garmin">Garmin</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No activities found</p>
          <p className="text-sm mt-2">
            Connect a fitness tracker and sync to see your runs here.
          </p>
          <Link to="/connected-services" className="text-pink-500 hover:text-pink-600 text-sm mt-2 inline-block">
            Go to Connected Services
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Distance</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Pace</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Matched</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {activities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {new Date(activity.activityDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/activities/${activity.id}`}
                        className="text-sm font-medium text-pink-600 hover:text-pink-800"
                      >
                        {activity.activityTitle || activity.activityType}
                      </Link>
                      <span className="ml-2 text-xs text-gray-400">{activity.activityType}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right whitespace-nowrap">
                      {formatDistance(activity.distanceMeters)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right whitespace-nowrap">
                      {formatDuration(activity.durationSeconds)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right whitespace-nowrap">
                      {formatPace(activity.averagePaceSecondsPerKm)}
                    </td>
                    <td className="px-4 py-3 text-center text-sm" title={activity.platform}>
                      {platformIcons[activity.platform] || activity.platform}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {activity.matchedTrainingSessionId ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Linked
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
