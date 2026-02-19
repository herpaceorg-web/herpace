import { Badge } from '@/components/ui/badge'

interface StudyFiltersProps {
  categories: string[]
  selectedCategory: string | null
  selectedTier: string | null
  selectedPhase: string | null
  searchQuery: string
  onCategoryChange: (category: string | null) => void
  onTierChange: (tier: string | null) => void
  onPhaseChange: (phase: string | null) => void
  onSearchChange: (query: string) => void
}

const tiers = [
  { value: 'A', label: 'Tier A', description: 'Meta-analysis / Systematic Review', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { value: 'B', label: 'Tier B', description: 'RCT / Cohort', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'C', label: 'Tier C', description: 'Observational / Review', color: 'bg-gray-100 text-gray-600 border-gray-200' },
]

const phases = [
  { value: 'Menstrual', label: 'Menstrual' },
  { value: 'Follicular', label: 'Follicular' },
  { value: 'Ovulatory', label: 'Ovulatory' },
  { value: 'Luteal', label: 'Luteal' },
]

export function StudyFilters({
  categories,
  selectedCategory,
  selectedTier,
  selectedPhase,
  searchQuery,
  onCategoryChange,
  onTierChange,
  onPhaseChange,
  onSearchChange,
}: StudyFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          placeholder="Search topics, findings, citations..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Evidence Tier */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Evidence Tier</p>
        <div className="flex flex-wrap gap-2">
          {tiers.map((tier) => (
            <button
              key={tier.value}
              onClick={() => onTierChange(selectedTier === tier.value ? null : tier.value)}
              title={tier.description}
            >
              <Badge
                className={`cursor-pointer transition-all ${
                  selectedTier === tier.value
                    ? tier.color + ' ring-2 ring-ring ring-offset-1'
                    : selectedTier
                      ? 'opacity-40 ' + tier.color
                      : tier.color
                }`}
              >
                {tier.label}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      {/* Cycle Phase */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Cycle Phase</p>
        <div className="flex flex-wrap gap-2">
          {phases.map((phase) => (
            <button
              key={phase.value}
              onClick={() => onPhaseChange(selectedPhase === phase.value ? null : phase.value)}
            >
              <Badge
                variant="outline"
                className={`cursor-pointer transition-all ${
                  selectedPhase === phase.value
                    ? 'bg-primary text-primary-foreground ring-2 ring-ring ring-offset-1'
                    : 'hover:bg-accent'
                }`}
              >
                {phase.label}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      {/* Topic Category */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Topic</p>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => onCategoryChange(selectedCategory === category ? null : category)}
            >
              <Badge
                variant="outline"
                className={`cursor-pointer transition-all ${
                  selectedCategory === category
                    ? 'bg-secondary text-secondary-foreground ring-2 ring-ring ring-offset-1'
                    : 'hover:bg-accent'
                }`}
              >
                {category}
              </Badge>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
