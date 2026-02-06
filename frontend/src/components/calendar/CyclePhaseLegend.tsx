import { CyclePhase } from '@/types/api'
import { Sprout, Sun, Leaf, Snowflake } from 'lucide-react'

const CYCLE_PHASE_ITEMS = [
  {
    phase: CyclePhase.Follicular,
    icon: Sprout,
    label: 'Follicular Phase',
  },
  {
    phase: CyclePhase.Ovulatory,
    icon: Sun,
    label: 'Ovulation',
  },
  {
    phase: CyclePhase.Luteal,
    icon: Leaf,
    label: 'Luteal Phase',
  },
  {
    phase: CyclePhase.Menstrual,
    icon: Snowflake,
    label: 'Menstruation',
  },
]

export function CyclePhaseLegend() {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      {CYCLE_PHASE_ITEMS.map((item, index) => {
        const Icon = item.icon
        return (
          <div key={item.phase} className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Icon className="w-4 h-4 text-foreground -mt-0.5" />
              <span className="text-base font-normal text-foreground whitespace-nowrap font-petrona leading-none">
                {item.label}
              </span>
            </div>
            {index < CYCLE_PHASE_ITEMS.length - 1 && (
              <div className="h-4 border-l border-border" style={{ width: '0px' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}
