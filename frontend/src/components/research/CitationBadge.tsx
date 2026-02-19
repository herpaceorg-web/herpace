import { Link } from 'react-router-dom'
import type { StudyCitationDto } from '@/types/api'

interface CitationBadgeProps {
  citation: StudyCitationDto
}

export function CitationBadge({ citation }: CitationBadgeProps) {
  return (
    <Link
      to={`/research/${citation.id}`}
      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
      title={citation.doi ? `DOI: ${citation.doi}` : undefined}
    >
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
      {citation.shortCitation}
    </Link>
  )
}
