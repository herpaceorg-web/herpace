package com.herpace.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import com.herpace.data.local.SyncStatus
import com.herpace.domain.model.CyclePhase
import com.herpace.domain.model.IntensityLevel
import com.herpace.domain.model.TrainingSession
import com.herpace.domain.model.WorkoutType
import java.time.DayOfWeek
import java.time.Instant
import java.time.LocalDate

@Entity(
    tableName = "training_sessions",
    foreignKeys = [
        ForeignKey(
            entity = TrainingPlanEntity::class,
            parentColumns = ["id"],
            childColumns = ["planId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [
        Index("planId"),
        Index("date"),
        Index("weekNumber"),
        Index("syncStatus"),
        Index(value = ["planId", "date"]),
        Index(value = ["planId", "weekNumber", "date"])
    ]
)
data class TrainingSessionEntity(
    @PrimaryKey val id: String,
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
    val completedAt: Instant? = null,
    val syncStatus: SyncStatus = SyncStatus.SYNCED,
    val lastModified: Instant = Instant.now(),
    val serverTimestamp: Instant? = null,
    val version: Int = 1
) {
    fun toDomain(): TrainingSession = TrainingSession(
        id = id,
        planId = planId,
        date = date,
        weekNumber = weekNumber,
        dayOfWeek = dayOfWeek,
        workoutType = workoutType,
        distanceKm = distanceKm,
        intensityLevel = intensityLevel,
        targetPaceMinPerKm = targetPaceMinPerKm,
        notes = notes,
        cyclePhase = cyclePhase,
        completed = completed,
        completedAt = completedAt
    )

    companion object {
        fun fromDomain(
            session: TrainingSession,
            syncStatus: SyncStatus = SyncStatus.SYNCED
        ): TrainingSessionEntity = TrainingSessionEntity(
            id = session.id,
            planId = session.planId,
            date = session.date,
            weekNumber = session.weekNumber,
            dayOfWeek = session.dayOfWeek,
            workoutType = session.workoutType,
            distanceKm = session.distanceKm,
            intensityLevel = session.intensityLevel,
            targetPaceMinPerKm = session.targetPaceMinPerKm,
            notes = session.notes,
            cyclePhase = session.cyclePhase,
            completed = session.completed,
            completedAt = session.completedAt,
            syncStatus = syncStatus,
            lastModified = Instant.now(),
            serverTimestamp = Instant.now()
        )
    }
}
