import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { researchApi } from '@/lib/api-client'
import { Badge } from '@/components/ui/badge'
import type { ResearchStudyDto } from '@/types/api'

const tierStyles: Record<string, string> = {
  A: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  B: 'bg-amber-100 text-amber-800 border-amber-200',
  C: 'bg-gray-100 text-gray-600 border-gray-200',
}

const tierDescriptions: Record<string, string> = {
  A: 'Systematic Review / Meta-Analysis',
  B: 'Randomized Controlled Trial / Cohort Study',
  C: 'Observational / Narrative Review',
}

export function ResearchStudyDetail() {
  const { id } = useParams<{ id: string }>()
  const [study, setStudy] = useState<ResearchStudyDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setIsLoading(true)
    researchApi.getStudy(parseInt(id, 10))
      .then(setStudy)
      .catch(() => setError('Failed to load study'))
      .finally(() => setIsLoading(false))
  }, [id])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error || !study) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <p className="text-muted-foreground">{error || 'Study not found'}</p>
        <Link to="/research" className="text-sm text-primary hover:underline mt-2 inline-block">
          Back to Research Library
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back link */}
      <Link
        to="/research"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Research Library
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h1 className="text-xl font-semibold leading-snug">{study.researchTopic}</h1>
          <Badge className={tierStyles[study.evidenceTier] || tierStyles.C}>
            Tier {study.evidenceTier}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {tierDescriptions[study.evidenceTier] || 'Research study'}
        </p>
      </div>

      {/* Citation */}
      <section className="mb-6">
        <h2 className="text-sm font-medium mb-1">Citation</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{study.citation}</p>
        {study.doi && (
          <a
            href={`https://doi.org/${study.doi}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
          >
            DOI: {study.doi}
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
        )}
      </section>

      {/* Study details grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground mb-1">Study Design</p>
          <p className="text-sm font-medium">{study.studyDesign}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground mb-1">Sample Size</p>
          <p className="text-sm font-medium">{study.sampleSize || 'N/A'}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground mb-1">Publication Year</p>
          <p className="text-sm font-medium">{study.publicationYear || 'N/A'}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground mb-1">Topic Category</p>
          <Badge variant="outline">{study.topicCategory}</Badge>
        </div>
      </div>

      {/* Key Findings */}
      <section className="mb-6">
        <h2 className="text-sm font-medium mb-2">Key Findings</h2>
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-sm leading-relaxed">{study.keyFindings}</p>
        </div>
      </section>

      {/* Phase Relevance */}
      {study.phaseRelevance && study.phaseRelevance.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-medium mb-2">Relevant Cycle Phases</h2>
          <div className="space-y-2">
            {study.phaseRelevance.map((pr) => (
              <div key={pr.phaseName} className="rounded-lg border p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">{pr.phaseName}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{pr.relevanceSummary}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
