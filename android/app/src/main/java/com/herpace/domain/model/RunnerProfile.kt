package com.herpace.domain.model

import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime

data class RunnerProfile(
    val userId: String,
    val name: String,
    val age: Int,
    val fitnessLevel: FitnessLevel,
    val currentWeeklyMileage: Double,
    val cycleLength: Int,
    val lastPeriodStartDate: LocalDate,
    val notificationsEnabled: Boolean,
    val reminderTimeMorning: LocalTime? = null,
    val reminderTimeEvening: LocalTime? = null,
    val lastUpdated: Instant
)
