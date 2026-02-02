import { useState, useEffect } from 'react'
import { api } from '@/lib/api-client'
import type { RaceWithStatsResponse } from '@/types/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RaceList } from '@/components/races/RaceList'

export default function TrainingHistory() {
  const [races, setRaces] = useState<RaceWithStatsResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadRaces()
  }, [])

  const loadRaces = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await api.get<RaceWithStatsResponse[]>('/api/races')
      setRaces(data)
    } catch (err: unknown) {
      console.error('Failed to load races:', err)
      setError('Failed to load races. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-muted animate-pulse rounded-lg"></div>
        <div className="h-96 bg-muted animate-pulse rounded-lg"></div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-2">Race History</h1>
        <p className="text-lg opacity-90">
          View all your races and training plans
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Races</CardTitle>
          <CardDescription>
            Click on a race to view its detailed training history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RaceList races={races} />
        </CardContent>
      </Card>
    </div>
  )
}
