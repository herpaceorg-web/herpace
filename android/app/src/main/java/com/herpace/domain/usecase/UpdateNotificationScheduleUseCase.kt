package com.herpace.domain.usecase

import com.herpace.domain.model.NotificationSchedule
import com.herpace.domain.repository.NotificationRepository
import com.herpace.notification.NotificationScheduler
import java.time.Instant
import javax.inject.Inject

class UpdateNotificationScheduleUseCase @Inject constructor(
    private val notificationRepository: NotificationRepository,
    private val notificationScheduler: NotificationScheduler
) {
    suspend operator fun invoke(schedule: NotificationSchedule) {
        val updatedSchedule = schedule.copy(updatedAt = Instant.now())
        notificationRepository.saveSchedule(updatedSchedule)

        // Reschedule WorkManager jobs based on new preferences
        if (updatedSchedule.enabled) {
            if (updatedSchedule.morningReminderEnabled && updatedSchedule.morningReminderTime != null) {
                notificationScheduler.scheduleMorningReminder(updatedSchedule.morningReminderTime)
            } else {
                notificationScheduler.cancelMorningReminder()
            }

            if (updatedSchedule.eveningReminderEnabled && updatedSchedule.eveningReminderTime != null) {
                notificationScheduler.scheduleEveningReminder(updatedSchedule.eveningReminderTime)
            } else {
                notificationScheduler.cancelEveningReminder()
            }
        } else {
            notificationScheduler.cancelAllReminders()
        }
    }
}
