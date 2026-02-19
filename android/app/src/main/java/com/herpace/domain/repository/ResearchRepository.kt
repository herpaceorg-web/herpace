package com.herpace.domain.repository

import com.herpace.domain.model.ResearchStudyDetail
import com.herpace.domain.model.ResearchStudySummary

interface ResearchRepository {
    suspend fun getStudies(
        category: String? = null,
        tier: String? = null,
        search: String? = null,
        phase: String? = null
    ): List<ResearchStudySummary>

    suspend fun getStudy(id: Int): ResearchStudyDetail

    suspend fun getCategories(): List<String>

    suspend fun getStudiesForPhase(phase: String): List<ResearchStudySummary>
}
