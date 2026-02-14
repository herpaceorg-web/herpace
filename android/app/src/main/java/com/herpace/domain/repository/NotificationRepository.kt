package com.herpace.domain.repository

import com.herpace.domain.model.NotificationSchedule
import kotlinx.coroutines.flow.Flow

interface NotificationRepository {
    suspend fun getSchedule(userId: String): NotificationSchedule?
    fun observeSchedule(userId: String): Flow<NotificationSchedule?>
    suspend fun saveSchedule(schedule: NotificationSchedule)
    suspend fun deleteSchedule(userId: String)
}
