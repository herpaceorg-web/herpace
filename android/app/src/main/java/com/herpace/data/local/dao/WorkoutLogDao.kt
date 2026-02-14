package com.herpace.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.herpace.data.local.entity.WorkoutLogEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface WorkoutLogDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(log: WorkoutLogEntity)

    @Query("SELECT * FROM workout_logs WHERE sessionId = :sessionId")
    suspend fun getBySessionId(sessionId: String): WorkoutLogEntity?

    @Query("SELECT * FROM workout_logs WHERE sessionId = :sessionId")
    fun observeBySessionId(sessionId: String): Flow<WorkoutLogEntity?>

    @Query("SELECT * FROM workout_logs WHERE userId = :userId ORDER BY loggedAt DESC")
    suspend fun getByUserId(userId: String): List<WorkoutLogEntity>

    @Query("DELETE FROM workout_logs WHERE id = :logId")
    suspend fun deleteById(logId: String)

    @Query("DELETE FROM workout_logs WHERE sessionId = :sessionId")
    suspend fun deleteBySessionId(sessionId: String)
}
