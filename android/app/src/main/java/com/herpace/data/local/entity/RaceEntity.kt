package com.herpace.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import com.herpace.data.local.SyncStatus
import com.herpace.domain.model.Race
import com.herpace.domain.model.RaceDistance
import java.time.Instant
import java.time.LocalDate

@Entity(
    tableName = "races",
    foreignKeys = [
        ForeignKey(
            entity = UserEntity::class,
            parentColumns = ["id"],
            childColumns = ["userId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [
        Index("userId"),
        Index("date"),
        Index("syncStatus"),
        Index(value = ["userId", "date"])
    ]
)
data class RaceEntity(
    @PrimaryKey val id: String,
    val userId: String,
    val name: String,
    val date: LocalDate,
    val distance: RaceDistance,
    val goalTimeMinutes: Int? = null,
    val createdAt: Instant,
    val updatedAt: Instant,
    val syncStatus: SyncStatus = SyncStatus.SYNCED,
    val lastModified: Instant = Instant.now(),
    val serverTimestamp: Instant? = null,
    val version: Int = 1
) {
    fun toDomain(): Race = Race(
        id = id,
        userId = userId,
        name = name,
        date = date,
        distance = distance,
        goalTimeMinutes = goalTimeMinutes,
        createdAt = createdAt,
        updatedAt = updatedAt
    )

    companion object {
        fun fromDomain(race: Race, syncStatus: SyncStatus = SyncStatus.SYNCED): RaceEntity =
            RaceEntity(
                id = race.id,
                userId = race.userId,
                name = race.name,
                date = race.date,
                distance = race.distance,
                goalTimeMinutes = race.goalTimeMinutes,
                createdAt = race.createdAt,
                updatedAt = race.updatedAt,
                syncStatus = syncStatus,
                lastModified = Instant.now(),
                serverTimestamp = Instant.now()
            )
    }
}
