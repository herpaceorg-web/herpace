package com.herpace.domain.usecase

import com.herpace.domain.model.NotificationSchedule
import com.herpace.domain.repository.NotificationRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class GetNotificationScheduleUseCase @Inject constructor(
    private val notificationRepository: NotificationRepository
) {
    suspend operator fun invoke(userId: String): NotificationSchedule? {
        return notificationRepository.getSchedule(userId)
    }

    fun observe(userId: String): Flow<NotificationSchedule?> {
        return notificationRepository.observeSchedule(userId)
    }
}
