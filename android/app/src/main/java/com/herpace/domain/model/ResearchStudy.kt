package com.herpace.domain.model

data class ResearchStudySummary(
    val id: Int,
    val researchTopic: String,
    val citation: String,
    val publicationYear: Int?,
    val evidenceTier: String,
    val topicCategory: String
)

data class ResearchStudyDetail(
    val id: Int,
    val researchTopic: String,
    val citation: String,
    val doi: String?,
    val studyDesign: String,
    val sampleSize: String?,
    val publicationYear: Int?,
    val keyFindings: String,
    val evidenceTier: String,
    val topicCategory: String,
    val phaseRelevance: List<PhaseRelevance>
)

data class PhaseRelevance(
    val phase: Int,
    val phaseName: String,
    val relevanceSummary: String
)
