package com.herpace.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class GeneratePlanRequest(
    val raceId: String
)

// POST /api/plans response
@Serializable
data class TrainingPlanResponse(
    val id: String,
    val raceId: String,
    val runnerId: String? = null,
    val planName: String? = null,
    val status: Int? = 0,
    val generationSource: Int? = null,
    val aiModel: String? = null,
    val aiRationale: String? = null,
    val startDate: String,
    val endDate: String,
    val trainingDaysPerWeek: Int? = null,
    val longRunDay: Int? = null,
    val planCompletionGoal: String? = null,
    val sessionCount: Int? = null,
    val createdAt: String? = null
)

// GET /api/plans/active response (includes sessions)
@Serializable
data class TrainingPlanDetailResponse(
    val id: String,
    val raceId: String,
    val raceName: String? = null,
    val raceDate: String? = null,
    val runnerId: String? = null,
    val planName: String? = null,
    val status: Int? = 0,
    val generationSource: Int? = null,
    val aiModel: String? = null,
    val aiRationale: String? = null,
    val startDate: String,
    val endDate: String,
    val trainingDaysPerWeek: Int? = null,
    val longRunDay: Int? = null,
    val daysBeforePeriodToReduceIntensity: Int? = null,
    val daysAfterPeriodToReduceIntensity: Int? = null,
    val planCompletionGoal: String? = null,
    val createdAt: String? = null,
    val sessions: List<TrainingSessionResponse> = emptyList()
)

@Serializable
data class TrainingSessionResponse(
    val id: String,
    val sessionName: String? = null,
    val scheduledDate: String,
    val workoutType: Int = 0,
    val durationMinutes: Int? = null,
    val distance: Double? = null,
    val intensityLevel: Int? = 0,
    val cyclePhase: Int? = null,
    val phaseGuidance: String? = null,
    val trainingStage: Int? = null,
    val completedAt: String? = null,
    val isSkipped: Boolean = false,
    val warmUp: String? = null,
    val recovery: String? = null,
    val sessionDescription: String? = null,
    val workoutTips: List<String> = emptyList(),
    val isCompleted: Boolean = false,
    val wasModified: Boolean = false,
    val actualDistance: Double? = null,
    val actualDuration: Int? = null,
    val rpe: Int? = null,
    val userNotes: String? = null
)
