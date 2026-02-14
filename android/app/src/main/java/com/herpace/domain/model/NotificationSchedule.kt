package com.herpace.domain.model

import java.time.Instant
import java.time.LocalTime

data class NotificationSchedule(
    val id: String,
    val userId: String,
    val enabled: Boolean = true,
    val morningReminderEnabled: Boolean = true,
    val morningReminderTime: LocalTime? = LocalTime.of(7, 0),
    val eveningReminderEnabled: Boolean = true,
    val eveningReminderTime: LocalTime? = LocalTime.of(18, 0),
    val updatedAt: Instant = Instant.now()
)
