package com.herpace.data.repository

import com.herpace.data.local.dao.WorkoutLogDao
import com.herpace.data.local.entity.WorkoutLogEntity
import com.herpace.domain.model.WorkoutLog
import com.herpace.domain.repository.WorkoutLogRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class WorkoutLogRepositoryImpl @Inject constructor(
    private val workoutLogDao: WorkoutLogDao
) : WorkoutLogRepository {

    override suspend fun logWorkout(log: WorkoutLog) {
        workoutLogDao.insert(WorkoutLogEntity.fromDomain(log))
    }

    override suspend fun getBySessionId(sessionId: String): WorkoutLog? {
        return workoutLogDao.getBySessionId(sessionId)?.toDomain()
    }

    override fun observeBySessionId(sessionId: String): Flow<WorkoutLog?> {
        return workoutLogDao.observeBySessionId(sessionId).map { it?.toDomain() }
    }

    override suspend fun getByUserId(userId: String): List<WorkoutLog> {
        return workoutLogDao.getByUserId(userId).map { it.toDomain() }
    }

    override suspend fun deleteById(logId: String) {
        workoutLogDao.deleteById(logId)
    }

    override suspend fun deleteBySessionId(sessionId: String) {
        workoutLogDao.deleteBySessionId(sessionId)
    }
}
