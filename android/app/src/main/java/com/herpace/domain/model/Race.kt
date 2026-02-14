package com.herpace.domain.model

import java.time.Instant
import java.time.LocalDate

data class Race(
    val id: String,
    val userId: String,
    val name: String,
    val date: LocalDate,
    val distance: RaceDistance,
    val goalTimeMinutes: Int? = null,
    val createdAt: Instant,
    val updatedAt: Instant
)
