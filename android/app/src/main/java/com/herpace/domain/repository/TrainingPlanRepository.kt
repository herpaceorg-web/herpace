package com.herpace.domain.repository

import com.herpace.data.remote.ApiResult
import com.herpace.domain.model.TrainingPlan
import com.herpace.domain.model.TrainingSession
import kotlinx.coroutines.flow.Flow

interface TrainingPlanRepository {
    suspend fun generatePlan(raceId: String): ApiResult<TrainingPlan>
    suspend fun getActivePlan(): ApiResult<TrainingPlan?>
    fun observeActivePlan(): Flow<TrainingPlan?>
    suspend fun getSessionsByPlanId(planId: String): ApiResult<List<TrainingSession>>
    fun observeSessionsByPlanId(planId: String): Flow<List<TrainingSession>>
    suspend fun getSessionsByWeek(planId: String, weekNumber: Int): List<TrainingSession>
    fun observeSessionsByWeek(planId: String, weekNumber: Int): Flow<List<TrainingSession>>
    suspend fun getSessionById(sessionId: String): TrainingSession?
    suspend fun markSessionCompleted(sessionId: String): ApiResult<Unit>
    suspend fun undoMarkSessionCompleted(sessionId: String): ApiResult<Unit>
    suspend fun getSessionsByDate(date: java.time.LocalDate): List<TrainingSession>
}
