import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import type { ResearchStudySummaryDto } from '@/types/api'

interface StudyCardProps {
  study: ResearchStudySummaryDto
}

const tierStyles: Record<string, string> = {
  A: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  B: 'bg-amber-100 text-amber-800 border-amber-200',
  C: 'bg-gray-100 text-gray-600 border-gray-200',
}

export function StudyCard({ study }: StudyCardProps) {
  return (
    <Link
      to={`/research/${study.id}`}
      className="block rounded-lg border bg-card p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm leading-snug mb-1">
            {study.researchTopic}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {study.citation}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge className={tierStyles[study.evidenceTier] || tierStyles.C}>
            Tier {study.evidenceTier}
          </Badge>
          {study.publicationYear && (
            <span className="text-xs text-muted-foreground">{study.publicationYear}</span>
          )}
        </div>
      </div>
      <div className="mt-2">
        <Badge variant="outline" className="text-xs">
          {study.topicCategory}
        </Badge>
      </div>
    </Link>
  )
}
