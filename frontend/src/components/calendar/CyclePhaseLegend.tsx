import { CyclePhase } from '@/types/api'
import { Sprout, Sun, Leaf, Snowflake } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

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
            <div className="flex items-center gap-2">
              <Icon className="w-5 h-5 text-foreground" />
              <span className="text-sm font-normal text-foreground whitespace-nowrap">
                {item.label}
              </span>
            </div>
            {index < CYCLE_PHASE_ITEMS.length - 1 && (
              <Separator orientation="vertical" className="h-4" />
            )}
          </div>
        )
      })}
    </div>
  )
}
