package com.herpace.domain.model

import java.time.DayOfWeek
import java.time.Instant
import java.time.LocalDate

data class TrainingSession(
    val id: String,
    val planId: String,
    val date: LocalDate,
    val weekNumber: Int,
    val dayOfWeek: DayOfWeek,
    val workoutType: WorkoutType,
    val distanceKm: Double? = null,
    val intensityLevel: IntensityLevel,
    val targetPaceMinPerKm: Double? = null,
    val notes: String? = null,
    val cyclePhase: CyclePhase,
    val completed: Boolean = false,
    val completedAt: Instant? = null
)
