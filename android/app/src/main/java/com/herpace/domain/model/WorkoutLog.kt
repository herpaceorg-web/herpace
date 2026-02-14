package com.herpace.domain.model

import java.time.Instant

data class WorkoutLog(
    val id: String,
    val sessionId: String,
    val userId: String,
    val actualDistanceKm: Double,
    val actualDurationMinutes: Int,
    val perceivedEffort: Int,
    val notes: String? = null,
    val importedFrom: FitnessPlatform? = null,
    val loggedAt: Instant = Instant.now()
)
