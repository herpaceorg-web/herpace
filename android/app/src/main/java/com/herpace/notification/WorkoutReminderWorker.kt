package com.herpace.notification

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.herpace.MainActivity
import com.herpace.R
import com.herpace.domain.model.TrainingSession
import com.herpace.domain.model.WorkoutType
import com.herpace.domain.repository.TrainingPlanRepository
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import java.time.LocalDate

@HiltWorker
class WorkoutReminderWorker @AssistedInject constructor(
    @Assisted appContext: Context,
    @Assisted workerParams: WorkerParameters,
    private val trainingPlanRepository: TrainingPlanRepository
) : CoroutineWorker(appContext, workerParams) {

    companion object {
        const val KEY_REMINDER_TYPE = "reminder_type"
        const val TYPE_EVENING = "evening"
        const val TYPE_MORNING = "morning"
        private const val CHANNEL_ID = HerPaceFirebaseMessagingService.CHANNEL_ID
        private var notificationId = 1000
    }

    override suspend fun doWork(): Result {
        val reminderType = inputData.getString(KEY_REMINDER_TYPE) ?: TYPE_MORNING

        val targetDate = when (reminderType) {
            TYPE_EVENING -> LocalDate.now().plusDays(1) // Tomorrow's session
            TYPE_MORNING -> LocalDate.now() // Today's session
            else -> LocalDate.now()
        }

        val sessions = trainingPlanRepository.getSessionsByDate(targetDate)
        val workoutSession = sessions.firstOrNull { it.workoutType != WorkoutType.REST_DAY && !it.completed }
            ?: return Result.success() // No workout to remind about

        val (title, body) = buildNotificationContent(reminderType, workoutSession)
        showNotification(title, body, workoutSession.id)

        return Result.success()
    }

    private fun buildNotificationContent(
        reminderType: String,
        session: TrainingSession
    ): Pair<String, String> {
        val workoutName = session.workoutType.displayName
        val distance = session.distanceKm?.let { "${String.format("%.1f", it)} km" } ?: ""

        return when (reminderType) {
            TYPE_EVENING -> {
                val title = "Tomorrow's Workout"
                val body = buildString {
                    append("$workoutName")
                    if (distance.isNotEmpty()) append(" - $distance")
                    append(". Get a good night's rest!")
                    append(" ${motivationalMessage(session.cyclePhase)}")
                }
                title to body
            }
            else -> {
                val title = "Time to Run!"
                val body = buildString {
                    append("$workoutName")
                    if (distance.isNotEmpty()) append(" - $distance")
                    append(" is on your schedule today.")
                    append(" ${motivationalMessage(session.cyclePhase)}")
                }
                title to body
            }
        }
    }

    private fun motivationalMessage(cyclePhase: com.herpace.domain.model.CyclePhase): String {
        return when (cyclePhase) {
            com.herpace.domain.model.CyclePhase.MENSTRUAL -> "Listen to your body and go at your own pace."
            com.herpace.domain.model.CyclePhase.FOLLICULAR -> "Your energy is rising - make the most of it!"
            com.herpace.domain.model.CyclePhase.OVULATORY -> "You're at peak energy - crush it!"
            com.herpace.domain.model.CyclePhase.LUTEAL -> "Steady effort today - you've got this!"
        }
    }

    private fun showNotification(title: String, body: String, sessionId: String) {
        createNotificationChannel()

        val intent = Intent(applicationContext, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("sessionId", sessionId)
        }

        val pendingIntent = PendingIntent.getActivity(
            applicationContext,
            notificationId,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(applicationContext, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setContentIntent(pendingIntent)
            .build()

        val notificationManager = applicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(notificationId++, notification)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                HerPaceFirebaseMessagingService.CHANNEL_NAME,
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Reminders for upcoming workouts"
            }
            val notificationManager = applicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }
}
