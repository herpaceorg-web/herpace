package com.herpace.domain.model

import java.time.Instant
import java.time.LocalDate

data class TrainingPlan(
    val id: String,
    val raceId: String,
    val userId: String,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val generatedAt: Instant,
    val totalWeeks: Int,
    val isActive: Boolean,
    val sessions: List<TrainingSession> = emptyList()
)
