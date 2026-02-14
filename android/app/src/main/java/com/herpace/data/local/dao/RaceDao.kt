package com.herpace.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.herpace.data.local.entity.RaceEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface RaceDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(race: RaceEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(races: List<RaceEntity>)

    @Update
    suspend fun update(race: RaceEntity)

    @Query("SELECT * FROM races WHERE userId = :userId ORDER BY date ASC")
    fun observeAllByUserId(userId: String): Flow<List<RaceEntity>>

    @Query("SELECT * FROM races WHERE userId = :userId ORDER BY date ASC")
    suspend fun getAllByUserId(userId: String): List<RaceEntity>

    @Query("SELECT * FROM races WHERE id = :raceId")
    suspend fun getById(raceId: String): RaceEntity?

    @Query("SELECT * FROM races WHERE id = :raceId")
    fun observeById(raceId: String): Flow<RaceEntity?>

    @Query("DELETE FROM races WHERE id = :raceId")
    suspend fun deleteById(raceId: String)

    @Query("DELETE FROM races WHERE userId = :userId")
    suspend fun deleteAllByUserId(userId: String)

    @Query("SELECT * FROM races WHERE syncStatus = :syncStatus")
    suspend fun getBySyncStatus(syncStatus: String): List<RaceEntity>

    @Query("UPDATE races SET syncStatus = :syncStatus WHERE id = :raceId")
    suspend fun updateSyncStatus(raceId: String, syncStatus: String)

    @Query("SELECT COUNT(*) FROM races WHERE syncStatus = :syncStatus")
    suspend fun countBySyncStatus(syncStatus: String): Int
}
