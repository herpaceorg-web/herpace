package com.herpace.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class ResearchStudySummaryResponse(
    val id: Int,
    val researchTopic: String,
    val citation: String,
    val publicationYear: Int? = null,
    val evidenceTier: String,
    val topicCategory: String
)

@Serializable
data class ResearchStudyDetailResponse(
    val id: Int,
    val researchTopic: String,
    val citation: String,
    val doi: String? = null,
    val studyDesign: String,
    val sampleSize: String? = null,
    val publicationYear: Int? = null,
    val keyFindings: String,
    val evidenceTier: String,
    val topicCategory: String,
    val phaseRelevance: List<PhaseRelevanceResponse> = emptyList()
)

@Serializable
data class PhaseRelevanceResponse(
    val phase: Int,
    val phaseName: String,
    val relevanceSummary: String
)

@Serializable
data class StudyCitationResponse(
    val id: Int,
    val shortCitation: String,
    val doi: String? = null
)
