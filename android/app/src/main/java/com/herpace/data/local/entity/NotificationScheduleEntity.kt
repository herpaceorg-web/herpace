package com.herpace.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import com.herpace.domain.model.NotificationSchedule
import java.time.Instant
import java.time.LocalTime

@Entity(
    tableName = "notification_schedules",
    foreignKeys = [
        ForeignKey(
            entity = UserEntity::class,
            parentColumns = ["id"],
            childColumns = ["userId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [
        Index(value = ["userId"], unique = true)
    ]
)
data class NotificationScheduleEntity(
    @PrimaryKey val id: String,
    val userId: String,
    val enabled: Boolean,
    val morningReminderEnabled: Boolean,
    val morningReminderTime: LocalTime?,
    val eveningReminderEnabled: Boolean,
    val eveningReminderTime: LocalTime?,
    val updatedAt: Instant
) {
    fun toDomain(): NotificationSchedule = NotificationSchedule(
        id = id,
        userId = userId,
        enabled = enabled,
        morningReminderEnabled = morningReminderEnabled,
        morningReminderTime = morningReminderTime,
        eveningReminderEnabled = eveningReminderEnabled,
        eveningReminderTime = eveningReminderTime,
        updatedAt = updatedAt
    )

    companion object {
        fun fromDomain(schedule: NotificationSchedule): NotificationScheduleEntity =
            NotificationScheduleEntity(
                id = schedule.id,
                userId = schedule.userId,
                enabled = schedule.enabled,
                morningReminderEnabled = schedule.morningReminderEnabled,
                morningReminderTime = schedule.morningReminderTime,
                eveningReminderEnabled = schedule.eveningReminderEnabled,
                eveningReminderTime = schedule.eveningReminderTime,
                updatedAt = schedule.updatedAt
            )
    }
}
