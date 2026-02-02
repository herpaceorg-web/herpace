import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { RaceWithStatsResponse } from '@/types/api'
import { DistanceType, PlanStatus, RaceCompletionStatus } from '@/types/api'

interface RaceListProps {
  races: RaceWithStatsResponse[]
}

export function RaceList({ races }: RaceListProps) {
  const navigate = useNavigate()

  if (races.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <p>No races found. Create your first race to get started!</p>
        </CardContent>
      </Card>
    )
  }

  const formatDistance = (distance: number, type: number) => {
    const types = ['5K', '10K', 'Half Marathon', 'Marathon', 'Custom']
    if (type === DistanceType.Custom) {
      return `${distance}km`
    }
    return types[type] || `${distance}km`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getCompletionBadge = (status: RaceCompletionStatus, result?: string) => {
    switch (status) {
      case RaceCompletionStatus.Completed:
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            Completed {result && `- ${result}`}
          </Badge>
        )
      case RaceCompletionStatus.DNS:
        return <Badge variant="secondary">DNS</Badge>
      case RaceCompletionStatus.DNF:
        return <Badge variant="secondary">DNF</Badge>
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      {races.map((race) => {
        const isActive = race.planStatus === PlanStatus.Active

        return (
          <Card
            key={race.id}
            className={cn(
              'cursor-pointer transition-all hover:shadow-lg',
              isActive && 'ring-2 ring-primary'
            )}
            onClick={() => navigate(`/history/${race.id}`)}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{race.raceName}</CardTitle>
                  {race.location && (
                    <p className="text-sm text-muted-foreground">{race.location}</p>
                  )}
                </div>
                {isActive && <Badge>Active</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="font-medium">Date:</span> {formatDate(race.raceDate)}
                  </div>
                  <div>
                    <span className="font-medium">Distance:</span>{' '}
                    {formatDistance(race.distance, race.distanceType)}
                  </div>
                  {race.goalTime && (
                    <div>
                      <span className="font-medium">Goal:</span> {race.goalTime}
                    </div>
                  )}
                </div>

                {race.hasTrainingPlan && (
                  <div className="text-sm text-muted-foreground">
                    Training Plan: {race.sessionCount} sessions
                  </div>
                )}

                {getCompletionBadge(race.completionStatus, race.raceResult)}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
