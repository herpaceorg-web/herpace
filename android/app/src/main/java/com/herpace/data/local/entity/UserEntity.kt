package com.herpace.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.herpace.data.local.SyncStatus
import com.herpace.domain.model.User
import java.time.Instant

@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey val id: String,
    val email: String,
    val createdAt: Instant,
    val syncStatus: SyncStatus = SyncStatus.SYNCED,
    val lastModified: Instant = Instant.now(),
    val serverTimestamp: Instant? = null,
    val version: Int = 1
) {
    fun toDomain(): User = User(
        id = id,
        email = email,
        createdAt = createdAt
    )

    companion object {
        fun fromDomain(user: User, syncStatus: SyncStatus = SyncStatus.SYNCED): UserEntity =
            UserEntity(
                id = user.id,
                email = user.email,
                createdAt = user.createdAt,
                syncStatus = syncStatus,
                lastModified = Instant.now(),
                serverTimestamp = Instant.now()
            )
    }
}
