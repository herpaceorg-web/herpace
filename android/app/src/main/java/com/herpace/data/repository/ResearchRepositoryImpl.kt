package com.herpace.data.repository

import com.herpace.data.remote.HerPaceApiService
import com.herpace.domain.model.PhaseRelevance
import com.herpace.domain.model.ResearchStudyDetail
import com.herpace.domain.model.ResearchStudySummary
import com.herpace.domain.repository.ResearchRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ResearchRepositoryImpl @Inject constructor(
    private val apiService: HerPaceApiService
) : ResearchRepository {

    override suspend fun getStudies(
        category: String?,
        tier: String?,
        search: String?,
        phase: String?
    ): List<ResearchStudySummary> {
        return apiService.getResearchStudies(category, tier, search, phase).map {
            ResearchStudySummary(
                id = it.id,
                researchTopic = it.researchTopic,
                citation = it.citation,
                publicationYear = it.publicationYear,
                evidenceTier = it.evidenceTier,
                topicCategory = it.topicCategory
            )
        }
    }

    override suspend fun getStudy(id: Int): ResearchStudyDetail {
        val response = apiService.getResearchStudy(id)
        return ResearchStudyDetail(
            id = response.id,
            researchTopic = response.researchTopic,
            citation = response.citation,
            doi = response.doi,
            studyDesign = response.studyDesign,
            sampleSize = response.sampleSize,
            publicationYear = response.publicationYear,
            keyFindings = response.keyFindings,
            evidenceTier = response.evidenceTier,
            topicCategory = response.topicCategory,
            phaseRelevance = response.phaseRelevance.map {
                PhaseRelevance(
                    phase = it.phase,
                    phaseName = it.phaseName,
                    relevanceSummary = it.relevanceSummary
                )
            }
        )
    }

    override suspend fun getCategories(): List<String> {
        return apiService.getResearchCategories()
    }

    override suspend fun getStudiesForPhase(phase: String): List<ResearchStudySummary> {
        return apiService.getResearchForPhase(phase).map {
            ResearchStudySummary(
                id = it.id,
                researchTopic = it.researchTopic,
                citation = it.citation,
                publicationYear = it.publicationYear,
                evidenceTier = it.evidenceTier,
                topicCategory = it.topicCategory
            )
        }
    }
}
