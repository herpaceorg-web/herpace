package com.herpace.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.herpace.data.local.entity.NotificationScheduleEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface NotificationScheduleDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdate(schedule: NotificationScheduleEntity)

    @Query("SELECT * FROM notification_schedules WHERE userId = :userId")
    suspend fun getByUserId(userId: String): NotificationScheduleEntity?

    @Query("SELECT * FROM notification_schedules WHERE userId = :userId")
    fun observeByUserId(userId: String): Flow<NotificationScheduleEntity?>

    @Query("DELETE FROM notification_schedules WHERE userId = :userId")
    suspend fun deleteByUserId(userId: String)
}
