package com.herpace.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import com.herpace.data.local.SyncStatus
import com.herpace.domain.model.TrainingPlan
import java.time.Instant
import java.time.LocalDate

@Entity(
    tableName = "training_plans",
    foreignKeys = [
        ForeignKey(
            entity = RaceEntity::class,
            parentColumns = ["id"],
            childColumns = ["raceId"],
            onDelete = ForeignKey.CASCADE
        ),
        ForeignKey(
            entity = UserEntity::class,
            parentColumns = ["id"],
            childColumns = ["userId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [
        Index("raceId"),
        Index("userId"),
        Index("isActive"),
        Index(value = ["userId", "isActive"]),
        Index(value = ["raceId", "generatedAt"])
    ]
)
data class TrainingPlanEntity(
    @PrimaryKey val id: String,
    val raceId: String,
    val userId: String,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val generatedAt: Instant,
    val totalWeeks: Int,
    val isActive: Boolean,
    val syncStatus: SyncStatus = SyncStatus.SYNCED,
    val lastModified: Instant = Instant.now(),
    val serverTimestamp: Instant? = null,
    val version: Int = 1
) {
    fun toDomain(sessions: List<com.herpace.domain.model.TrainingSession> = emptyList()): TrainingPlan =
        TrainingPlan(
            id = id,
            raceId = raceId,
            userId = userId,
            startDate = startDate,
            endDate = endDate,
            generatedAt = generatedAt,
            totalWeeks = totalWeeks,
            isActive = isActive,
            sessions = sessions
        )

    companion object {
        fun fromDomain(
            plan: TrainingPlan,
            syncStatus: SyncStatus = SyncStatus.SYNCED
        ): TrainingPlanEntity = TrainingPlanEntity(
            id = plan.id,
            raceId = plan.raceId,
            userId = plan.userId,
            startDate = plan.startDate,
            endDate = plan.endDate,
            generatedAt = plan.generatedAt,
            totalWeeks = plan.totalWeeks,
            isActive = plan.isActive,
            syncStatus = syncStatus,
            lastModified = Instant.now(),
            serverTimestamp = Instant.now()
        )
    }
}
