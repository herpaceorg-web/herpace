package com.herpace.notification

import android.content.Context
import androidx.work.Data
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import dagger.hilt.android.qualifiers.ApplicationContext
import java.time.Duration
import java.time.LocalDateTime
import java.time.LocalTime
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NotificationScheduler @Inject constructor(
    @ApplicationContext private val context: Context
) {
    companion object {
        const val EVENING_REMINDER_TAG = "herpace_evening_reminder"
        const val MORNING_REMINDER_TAG = "herpace_morning_reminder"
    }

    fun scheduleEveningReminder(reminderTime: LocalTime = LocalTime.of(18, 0)) {
        val initialDelay = calculateInitialDelay(reminderTime)

        val inputData = Data.Builder()
            .putString(WorkoutReminderWorker.KEY_REMINDER_TYPE, WorkoutReminderWorker.TYPE_EVENING)
            .build()

        val workRequest = PeriodicWorkRequestBuilder<WorkoutReminderWorker>(
            1, TimeUnit.DAYS
        )
            .setInitialDelay(initialDelay, TimeUnit.MILLISECONDS)
            .setInputData(inputData)
            .addTag(EVENING_REMINDER_TAG)
            .build()

        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            EVENING_REMINDER_TAG,
            ExistingPeriodicWorkPolicy.UPDATE,
            workRequest
        )
    }

    fun scheduleMorningReminder(reminderTime: LocalTime = LocalTime.of(7, 0)) {
        val initialDelay = calculateInitialDelay(reminderTime)

        val inputData = Data.Builder()
            .putString(WorkoutReminderWorker.KEY_REMINDER_TYPE, WorkoutReminderWorker.TYPE_MORNING)
            .build()

        val workRequest = PeriodicWorkRequestBuilder<WorkoutReminderWorker>(
            1, TimeUnit.DAYS
        )
            .setInitialDelay(initialDelay, TimeUnit.MILLISECONDS)
            .setInputData(inputData)
            .addTag(MORNING_REMINDER_TAG)
            .build()

        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            MORNING_REMINDER_TAG,
            ExistingPeriodicWorkPolicy.UPDATE,
            workRequest
        )
    }

    fun cancelEveningReminder() {
        WorkManager.getInstance(context).cancelUniqueWork(EVENING_REMINDER_TAG)
    }

    fun cancelMorningReminder() {
        WorkManager.getInstance(context).cancelUniqueWork(MORNING_REMINDER_TAG)
    }

    fun cancelAllReminders() {
        cancelEveningReminder()
        cancelMorningReminder()
    }

    private fun calculateInitialDelay(targetTime: LocalTime): Long {
        val now = LocalDateTime.now()
        var targetDateTime = now.toLocalDate().atTime(targetTime)

        // If target time already passed today, schedule for tomorrow
        if (targetDateTime.isBefore(now)) {
            targetDateTime = targetDateTime.plusDays(1)
        }

        return Duration.between(now, targetDateTime).toMillis()
    }
}
