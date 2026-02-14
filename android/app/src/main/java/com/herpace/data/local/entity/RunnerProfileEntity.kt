package com.herpace.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import com.herpace.data.local.SyncStatus
import com.herpace.domain.model.FitnessLevel
import com.herpace.domain.model.RunnerProfile
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime

@Entity(
    tableName = "runner_profiles",
    foreignKeys = [
        ForeignKey(
            entity = UserEntity::class,
            parentColumns = ["id"],
            childColumns = ["userId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("userId"), Index("syncStatus")]
)
data class RunnerProfileEntity(
    @PrimaryKey val userId: String,
    val name: String,
    val age: Int,
    val fitnessLevel: FitnessLevel,
    val currentWeeklyMileage: Double,
    val cycleLength: Int,
    val lastPeriodStartDate: LocalDate,
    val notificationsEnabled: Boolean,
    val reminderTimeMorning: LocalTime? = null,
    val reminderTimeEvening: LocalTime? = null,
    val notificationScheduleId: String? = null,
    val lastUpdated: Instant,
    val syncStatus: SyncStatus = SyncStatus.SYNCED,
    val lastModified: Instant = Instant.now(),
    val serverTimestamp: Instant? = null,
    val version: Int = 1
) {
    fun toDomain(): RunnerProfile = RunnerProfile(
        userId = userId,
        name = name,
        age = age,
        fitnessLevel = fitnessLevel,
        currentWeeklyMileage = currentWeeklyMileage,
        cycleLength = cycleLength,
        lastPeriodStartDate = lastPeriodStartDate,
        notificationsEnabled = notificationsEnabled,
        reminderTimeMorning = reminderTimeMorning,
        reminderTimeEvening = reminderTimeEvening,
        lastUpdated = lastUpdated
    )

    companion object {
        fun fromDomain(
            profile: RunnerProfile,
            syncStatus: SyncStatus = SyncStatus.SYNCED
        ): RunnerProfileEntity = RunnerProfileEntity(
            userId = profile.userId,
            name = profile.name,
            age = profile.age,
            fitnessLevel = profile.fitnessLevel,
            currentWeeklyMileage = profile.currentWeeklyMileage,
            cycleLength = profile.cycleLength,
            lastPeriodStartDate = profile.lastPeriodStartDate,
            notificationsEnabled = profile.notificationsEnabled,
            reminderTimeMorning = profile.reminderTimeMorning,
            reminderTimeEvening = profile.reminderTimeEvening,
            lastUpdated = profile.lastUpdated,
            syncStatus = syncStatus,
            lastModified = Instant.now(),
            serverTimestamp = Instant.now()
        )
    }
}
