package com.herpace.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class RaceResponse(
    val id: String,
    val runnerId: String? = null,
    val raceName: String,
    val location: String? = null,
    val raceDate: String,
    val trainingStartDate: String? = null,
    val distance: Double = 0.0,
    val distanceType: Int = 0,
    val goalTime: String? = null,
    val raceCompletionGoal: String? = null,
    val completionStatus: Int? = 0,
    val raceResult: String? = null,
    val resultLoggedAt: String? = null,
    val isPublic: Boolean = false,
    val createdAt: String? = null,
    val hasTrainingPlan: Boolean = false,
    // Fields from RaceWithStatsResponse (GET /api/races list)
    val sessionCount: Int? = null,
    val planStatus: String? = null
)

@Serializable
data class CreateRaceRequest(
    val raceName: String,
    val raceDate: String,
    val distance: Double,
    val distanceType: Int,
    val goalTime: String? = null,
    val location: String? = null
)

@Serializable
data class UpdateRaceRequest(
    val raceName: String,
    val raceDate: String,
    val distance: Double,
    val distanceType: Int,
    val goalTime: String? = null,
    val location: String? = null
)
