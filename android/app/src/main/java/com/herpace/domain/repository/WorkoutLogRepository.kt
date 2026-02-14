package com.herpace.domain.repository

import com.herpace.domain.model.WorkoutLog
import kotlinx.coroutines.flow.Flow

interface WorkoutLogRepository {
    suspend fun logWorkout(log: WorkoutLog)
    suspend fun getBySessionId(sessionId: String): WorkoutLog?
    fun observeBySessionId(sessionId: String): Flow<WorkoutLog?>
    suspend fun getByUserId(userId: String): List<WorkoutLog>
    suspend fun deleteById(logId: String)
    suspend fun deleteBySessionId(sessionId: String)
}
