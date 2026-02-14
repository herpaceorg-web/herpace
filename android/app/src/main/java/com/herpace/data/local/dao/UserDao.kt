package com.herpace.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.herpace.data.local.entity.UserEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface UserDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(user: UserEntity)

    @Query("SELECT * FROM users WHERE id = :userId")
    suspend fun getById(userId: String): UserEntity?

    @Query("SELECT * FROM users WHERE id = :userId")
    fun observeById(userId: String): Flow<UserEntity?>

    @Query("SELECT * FROM users LIMIT 1")
    suspend fun getCurrentUser(): UserEntity?

    @Query("SELECT * FROM users LIMIT 1")
    fun observeCurrentUser(): Flow<UserEntity?>

    @Query("DELETE FROM users WHERE id = :userId")
    suspend fun deleteById(userId: String)

    @Query("DELETE FROM users")
    suspend fun deleteAll()
}
