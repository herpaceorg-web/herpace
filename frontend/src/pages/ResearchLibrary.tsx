import { useState, useEffect } from 'react'
import { researchApi } from '@/lib/api-client'
import { StudyCard } from '@/components/research/StudyCard'
import { StudyFilters } from '@/components/research/StudyFilters'
import type { ResearchStudySummaryDto } from '@/types/api'

export function ResearchLibrary() {
  const [studies, setStudies] = useState<ResearchStudySummaryDto[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTier, setSelectedTier] = useState<string | null>(null)
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Load categories on mount
  useEffect(() => {
    researchApi.getCategories()
      .then(setCategories)
      .catch(() => { /* categories are optional */ })
  }, [])

  // Load studies when filters change
  useEffect(() => {
    setIsLoading(true)
    setError(null)

    const params: Record<string, string> = {}
    if (selectedCategory) params.category = selectedCategory
    if (selectedTier) params.tier = selectedTier
    if (selectedPhase) params.phase = selectedPhase
    if (searchQuery.trim()) params.search = searchQuery.trim()

    researchApi.getStudies(params)
      .then(setStudies)
      .catch(() => setError('Failed to load research studies'))
      .finally(() => setIsLoading(false))
  }, [selectedCategory, selectedTier, selectedPhase, searchQuery])

  // Debounce search input
  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(debouncedSearch), 300)
    return () => clearTimeout(timer)
  }, [debouncedSearch])

  const hasActiveFilters = selectedCategory || selectedTier || selectedPhase || searchQuery

  const studyCount = studies.length

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Research Library</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {studyCount} peer-reviewed studies powering your training
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <StudyFilters
          categories={categories}
          selectedCategory={selectedCategory}
          selectedTier={selectedTier}
          selectedPhase={selectedPhase}
          searchQuery={debouncedSearch}
          onCategoryChange={setSelectedCategory}
          onTierChange={setSelectedTier}
          onPhaseChange={setSelectedPhase}
          onSearchChange={setDebouncedSearch}
        />
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {studyCount} {studyCount === 1 ? 'study' : 'studies'} found
          </span>
          <button
            onClick={() => {
              setSelectedCategory(null)
              setSelectedTier(null)
              setSelectedPhase(null)
              setDebouncedSearch('')
              setSearchQuery('')
            }}
            className="text-xs text-primary hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Study list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>{error}</p>
        </div>
      ) : studies.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No studies match your filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {studies.map((study) => (
            <StudyCard key={study.id} study={study} />
          ))}
        </div>
      )}
    </div>
  )
}
