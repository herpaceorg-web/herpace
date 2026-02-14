package com.herpace.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.herpace.data.local.entity.TrainingSessionEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface TrainingSessionDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(sessions: List<TrainingSessionEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(session: TrainingSessionEntity)

    @Query("SELECT * FROM training_sessions WHERE planId = :planId ORDER BY date ASC")
    suspend fun getByPlanId(planId: String): List<TrainingSessionEntity>

    @Query("SELECT * FROM training_sessions WHERE planId = :planId ORDER BY date ASC")
    fun observeByPlanId(planId: String): Flow<List<TrainingSessionEntity>>

    @Query("SELECT * FROM training_sessions WHERE date = :date AND planId = :planId")
    suspend fun getByDate(planId: String, date: String): List<TrainingSessionEntity>

    @Query("SELECT * FROM training_sessions WHERE planId = :planId AND weekNumber = :weekNumber ORDER BY date ASC")
    suspend fun getByWeek(planId: String, weekNumber: Int): List<TrainingSessionEntity>

    @Query("SELECT * FROM training_sessions WHERE planId = :planId AND weekNumber = :weekNumber ORDER BY date ASC")
    fun observeByWeek(planId: String, weekNumber: Int): Flow<List<TrainingSessionEntity>>

    @Query("SELECT * FROM training_sessions WHERE id = :sessionId")
    suspend fun getById(sessionId: String): TrainingSessionEntity?

    @Query("UPDATE training_sessions SET completed = 1, completedAt = :completedAt WHERE id = :sessionId")
    suspend fun markCompleted(sessionId: String, completedAt: Long)

    @Query("UPDATE training_sessions SET completed = 0, completedAt = NULL WHERE id = :sessionId")
    suspend fun undoCompleted(sessionId: String)

    @Query("UPDATE training_sessions SET cyclePhase = :cyclePhase WHERE id = :sessionId")
    suspend fun updateCyclePhase(sessionId: String, cyclePhase: String)

    @Query("DELETE FROM training_sessions WHERE planId = :planId")
    suspend fun deleteByPlanId(planId: String)

    @Query("SELECT * FROM training_sessions WHERE syncStatus = :syncStatus")
    suspend fun getBySyncStatus(syncStatus: String): List<TrainingSessionEntity>

    @Query("UPDATE training_sessions SET syncStatus = :syncStatus WHERE id = :sessionId")
    suspend fun updateSyncStatus(sessionId: String, syncStatus: String)

    @Query("SELECT COUNT(*) FROM training_sessions WHERE syncStatus = :syncStatus")
    suspend fun countBySyncStatus(syncStatus: String): Int
}
