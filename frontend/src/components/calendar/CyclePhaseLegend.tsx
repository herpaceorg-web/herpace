import { CyclePhase } from '@/types/api'
import { getCyclePhaseBadgeColor, getCyclePhaseName } from '@/utils/cyclePhases'

const CYCLE_PHASES = [
  CyclePhase.Menstrual,
  CyclePhase.Follicular,
  CyclePhase.Ovulatory,
  CyclePhase.Luteal,
]

export function CyclePhaseLegend() {
  return (
    <div className="bg-muted/50 rounded-lg p-4">
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-sm font-medium text-muted-foreground">
          Cycle Phases:
        </span>
        <div className="flex flex-wrap gap-4">
          {CYCLE_PHASES.map((phase) => (
            <div key={phase} className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${getCyclePhaseBadgeColor(phase)}`}
                aria-hidden="true"
              />
              <span className="text-sm">{getCyclePhaseName(phase)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
