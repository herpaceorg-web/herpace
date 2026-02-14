import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useToast } from '@/contexts/ToastContext'
import { fitnessTrackerApi } from '@/lib/api-client'
import type { ImportedActivityDetailDto } from '@/types/api'

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

export function ImportedActivityDetail() {
  const { id } = useParams<{ id: string }>()
  const [activity, setActivity] = useState<ImportedActivityDetailDto | null>(null)
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  useEffect(() => {
    if (!id) return
    loadActivity()
  }, [id])

  const loadActivity = async () => {
    try {
      setLoading(true)
      const result = await fitnessTrackerApi.getActivityDetail(id!)
      setActivity(result)
    } catch {
      toast.error('Failed to load activity', 'Could not fetch activity details.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" role="status" aria-label="Loading activity details">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
      </div>
    )
  }

  if (!activity) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-500">Activity not found</p>
        <Link to="/activities" className="text-pink-500 hover:text-pink-600 focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:outline-none text-sm mt-2 inline-block">
          Back to Activities
        </Link>
      </div>
    )
  }

  return (
    <main className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/activities" aria-label="Back to activities list" className="text-gray-400 hover:text-gray-600 focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:outline-none transition-colors">
          &larr; Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {activity.activityTitle || activity.activityType}
          </h1>
          <p className="text-gray-500 text-sm">
            {new Date(activity.activityDate).toLocaleDateString(undefined, {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })}
            {' \u00B7 '}
            {activity.platform}
            {' \u00B7 '}
            {activity.activityType}
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Distance" value={formatDistance(activity.distanceMeters)} />
        <MetricCard label="Duration" value={formatDuration(activity.durationSeconds)} />
        <MetricCard label="Pace" value={formatPace(activity.averagePaceSecondsPerKm)} />
        {activity.movingTimeSeconds != null && (
          <MetricCard label="Moving Time" value={formatDuration(activity.movingTimeSeconds)} />
        )}
      </div>

      {/* Heart Rate & Cadence */}
      {(activity.averageHeartRate != null || activity.maxHeartRate != null || activity.cadence != null) && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Heart Rate & Cadence</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {activity.averageHeartRate != null && (
              <MetricItem label="Avg Heart Rate" value={`${activity.averageHeartRate} bpm`} />
            )}
            {activity.maxHeartRate != null && (
              <MetricItem label="Max Heart Rate" value={`${activity.maxHeartRate} bpm`} />
            )}
            {activity.cadence != null && (
              <MetricItem label="Cadence" value={`${activity.cadence} spm`} />
            )}
          </div>
        </div>
      )}

      {/* Elevation & Calories */}
      {(activity.elevationGainMeters != null || activity.caloriesBurned != null) && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Elevation & Energy</h2>
          <div className="grid grid-cols-2 gap-4">
            {activity.elevationGainMeters != null && (
              <MetricItem label="Elevation Gain" value={`${activity.elevationGainMeters.toFixed(0)} m`} />
            )}
            {activity.caloriesBurned != null && (
              <MetricItem label="Calories" value={`${activity.caloriesBurned} kcal`} />
            )}
          </div>
        </div>
      )}

      {/* GPS Route */}
      {activity.gpsRoute && activity.gpsRoute.length > 0 && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Route</h2>
          <div className="bg-gray-100 rounded-lg p-8 text-center text-gray-500 text-sm">
            <p>Route map with {activity.gpsRoute.length} GPS points</p>
            <p className="text-xs mt-1 text-gray-400">
              Start: {activity.gpsRoute[0].lat.toFixed(4)}, {activity.gpsRoute[0].lng.toFixed(4)}
              {activity.gpsRoute.length > 1 && (
                <> &rarr; End: {activity.gpsRoute[activity.gpsRoute.length - 1].lat.toFixed(4)}, {activity.gpsRoute[activity.gpsRoute.length - 1].lng.toFixed(4)}</>
              )}
            </p>
            <p className="text-xs mt-2 text-gray-400">Map visualization coming in a future update</p>
          </div>
        </div>
      )}

      {/* Matched Training Session */}
      {activity.matchedTrainingSession && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Matched Training Session</h2>
          <div className="bg-pink-50 rounded-lg p-4">
            <p className="font-medium text-pink-900">
              {activity.matchedTrainingSession.sessionName}
            </p>
            <p className="text-sm text-pink-700 mt-1">
              {activity.matchedTrainingSession.workoutType}
              {' \u00B7 '}
              Scheduled: {new Date(activity.matchedTrainingSession.scheduledDate).toLocaleDateString()}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-pink-600 font-medium">Planned</span>
                <div className="text-pink-800 mt-1">
                  {activity.matchedTrainingSession.plannedDistance != null && (
                    <p>Distance: {formatDistance(activity.matchedTrainingSession.plannedDistance)}</p>
                  )}
                  {activity.matchedTrainingSession.plannedDuration != null && (
                    <p>Duration: {formatDuration(activity.matchedTrainingSession.plannedDuration * 60)}</p>
                  )}
                </div>
              </div>
              <div>
                <span className="text-pink-600 font-medium">Actual</span>
                <div className="text-pink-800 mt-1">
                  <p>Distance: {formatDistance(activity.distanceMeters)}</p>
                  <p>Duration: {formatDuration(activity.durationSeconds)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400">
        Imported: {new Date(activity.importedAt).toLocaleString()}
      </p>
    </main>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-xl font-semibold text-gray-900 mt-1">{value}</p>
    </div>
  )
}

function MetricItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-base font-medium text-gray-900">{value}</p>
    </div>
  )
}
