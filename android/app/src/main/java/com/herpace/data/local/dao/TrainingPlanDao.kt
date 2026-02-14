package com.herpace.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.herpace.data.local.entity.TrainingPlanEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface TrainingPlanDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(plan: TrainingPlanEntity)

    @Query("SELECT * FROM training_plans WHERE isActive = 1 AND userId = :userId LIMIT 1")
    suspend fun getActivePlan(userId: String): TrainingPlanEntity?

    @Query("SELECT * FROM training_plans WHERE isActive = 1 AND userId = :userId LIMIT 1")
    fun observeActivePlan(userId: String): Flow<TrainingPlanEntity?>

    @Query("SELECT * FROM training_plans WHERE raceId = :raceId ORDER BY generatedAt DESC LIMIT 1")
    suspend fun getByRaceId(raceId: String): TrainingPlanEntity?

    @Query("SELECT * FROM training_plans WHERE id = :planId")
    suspend fun getById(planId: String): TrainingPlanEntity?

    @Query("UPDATE training_plans SET isActive = 0 WHERE userId = :userId")
    suspend fun deactivateAllForUser(userId: String)

    @Query("DELETE FROM training_plans WHERE id = :planId")
    suspend fun deleteById(planId: String)

    @Query("DELETE FROM training_plans WHERE userId = :userId")
    suspend fun deleteAllByUserId(userId: String)
}
