package com.herpace.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class RunnerProfileResponse(
    val id: String? = null,
    val userId: String? = null,
    val name: String,
    val dateOfBirth: String? = null,
    val fitnessLevel: Int = 0,
    val typicalWeeklyMileage: Double? = null,
    val distanceUnit: Int? = 0,
    val fiveKPR: String? = null,
    val tenKPR: String? = null,
    val halfMarathonPR: String? = null,
    val marathonPR: String? = null,
    val cycleLength: Int? = null,
    val lastPeriodStart: String? = null,
    val lastPeriodEnd: String? = null,
    val typicalCycleRegularity: Int? = 0,
    val createdAt: String? = null
)

@Serializable
data class RunnerProfileRequest(
    val name: String,
    val dateOfBirth: String? = null,
    val fitnessLevel: Int,
    val typicalWeeklyMileage: Double? = null,
    val distanceUnit: Int = 0,
    val cycleLength: Int? = null,
    val lastPeriodStart: String? = null,
    val lastPeriodEnd: String? = null,
    val typicalCycleRegularity: Int = 0
)
