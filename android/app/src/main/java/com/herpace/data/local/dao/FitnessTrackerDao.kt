package com.herpace.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.herpace.data.local.entity.ImportedActivityEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface FitnessTrackerDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertActivities(activities: List<ImportedActivityEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertActivity(activity: ImportedActivityEntity)

    @Query("SELECT * FROM imported_activities ORDER BY activityDate DESC")
    fun observeAllActivities(): Flow<List<ImportedActivityEntity>>

    @Query("SELECT * FROM imported_activities WHERE platform = :platform ORDER BY activityDate DESC")
    fun observeActivitiesByPlatform(platform: String): Flow<List<ImportedActivityEntity>>

    @Query("SELECT * FROM imported_activities WHERE id = :id")
    suspend fun getActivityById(id: String): ImportedActivityEntity?

    @Query("SELECT * FROM imported_activities WHERE id = :id")
    fun observeActivityById(id: String): Flow<ImportedActivityEntity?>

    @Query("SELECT COUNT(*) FROM imported_activities")
    suspend fun getActivityCount(): Int

    @Query("SELECT COUNT(*) FROM imported_activities WHERE platform = :platform")
    suspend fun getActivityCountByPlatform(platform: String): Int

    @Query("DELETE FROM imported_activities")
    suspend fun deleteAll()

    @Query("DELETE FROM imported_activities WHERE platform = :platform")
    suspend fun deleteByPlatform(platform: String)
}
