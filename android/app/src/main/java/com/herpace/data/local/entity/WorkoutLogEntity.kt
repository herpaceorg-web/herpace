package com.herpace.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import com.herpace.domain.model.FitnessPlatform
import com.herpace.domain.model.WorkoutLog
import java.time.Instant

@Entity(
    tableName = "workout_logs",
    foreignKeys = [
        ForeignKey(
            entity = TrainingSessionEntity::class,
            parentColumns = ["id"],
            childColumns = ["sessionId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [
        Index("sessionId", unique = true),
        Index("userId"),
        Index(value = ["userId", "loggedAt"])
    ]
)
data class WorkoutLogEntity(
    @PrimaryKey val id: String,
    val sessionId: String,
    val userId: String,
    val actualDistanceKm: Double,
    val actualDurationMinutes: Int,
    val perceivedEffort: Int,
    val notes: String? = null,
    val importedFrom: FitnessPlatform? = null,
    val loggedAt: Instant = Instant.now()
) {
    fun toDomain(): WorkoutLog = WorkoutLog(
        id = id,
        sessionId = sessionId,
        userId = userId,
        actualDistanceKm = actualDistanceKm,
        actualDurationMinutes = actualDurationMinutes,
        perceivedEffort = perceivedEffort,
        notes = notes,
        importedFrom = importedFrom,
        loggedAt = loggedAt
    )

    companion object {
        fun fromDomain(log: WorkoutLog): WorkoutLogEntity = WorkoutLogEntity(
            id = log.id,
            sessionId = log.sessionId,
            userId = log.userId,
            actualDistanceKm = log.actualDistanceKm,
            actualDurationMinutes = log.actualDurationMinutes,
            perceivedEffort = log.perceivedEffort,
            notes = log.notes,
            importedFrom = log.importedFrom,
            loggedAt = log.loggedAt
        )
    }
}
