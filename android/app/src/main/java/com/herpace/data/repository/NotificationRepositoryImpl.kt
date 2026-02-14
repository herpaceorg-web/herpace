package com.herpace.data.repository

import com.herpace.data.local.dao.NotificationScheduleDao
import com.herpace.data.local.entity.NotificationScheduleEntity
import com.herpace.domain.model.NotificationSchedule
import com.herpace.domain.repository.NotificationRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NotificationRepositoryImpl @Inject constructor(
    private val notificationScheduleDao: NotificationScheduleDao
) : NotificationRepository {

    override suspend fun getSchedule(userId: String): NotificationSchedule? {
        return notificationScheduleDao.getByUserId(userId)?.toDomain()
    }

    override fun observeSchedule(userId: String): Flow<NotificationSchedule?> {
        return notificationScheduleDao.observeByUserId(userId).map { it?.toDomain() }
    }

    override suspend fun saveSchedule(schedule: NotificationSchedule) {
        notificationScheduleDao.insertOrUpdate(NotificationScheduleEntity.fromDomain(schedule))
    }

    override suspend fun deleteSchedule(userId: String) {
        notificationScheduleDao.deleteByUserId(userId)
    }
}
