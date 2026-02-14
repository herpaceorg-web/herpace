package com.herpace.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.herpace.data.local.entity.RunnerProfileEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface RunnerProfileDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(profile: RunnerProfileEntity)

    @Update
    suspend fun update(profile: RunnerProfileEntity)

    @Query("SELECT * FROM runner_profiles WHERE userId = :userId")
    suspend fun getByUserId(userId: String): RunnerProfileEntity?

    @Query("SELECT * FROM runner_profiles WHERE userId = :userId")
    fun observeByUserId(userId: String): Flow<RunnerProfileEntity?>

    @Query("DELETE FROM runner_profiles WHERE userId = :userId")
    suspend fun deleteByUserId(userId: String)

    @Query("SELECT * FROM runner_profiles WHERE syncStatus = :syncStatus")
    suspend fun getBySyncStatus(syncStatus: String): List<RunnerProfileEntity>

    @Query("UPDATE runner_profiles SET syncStatus = :syncStatus WHERE userId = :userId")
    suspend fun updateSyncStatus(userId: String, syncStatus: String)

    @Query("SELECT COUNT(*) FROM runner_profiles WHERE syncStatus = :syncStatus")
    suspend fun countBySyncStatus(syncStatus: String): Int
}
