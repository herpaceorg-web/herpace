package com.herpace.util

import com.google.firebase.analytics.FirebaseAnalytics
import com.google.firebase.analytics.logEvent
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AnalyticsHelper @Inject constructor(
    private val firebaseAnalytics: FirebaseAnalytics?
) {
    fun logLogin(method: String = "email") {
        firebaseAnalytics?.logEvent(FirebaseAnalytics.Event.LOGIN) {
            param(FirebaseAnalytics.Param.METHOD, method)
        }
    }

    fun logSignup(method: String = "email") {
        firebaseAnalytics?.logEvent(FirebaseAnalytics.Event.SIGN_UP) {
            param(FirebaseAnalytics.Param.METHOD, method)
        }
    }

    fun logOnboardingComplete() {
        firebaseAnalytics?.logEvent("onboarding_complete", null)
    }

    fun logRaceCreated(distance: String) {
        firebaseAnalytics?.logEvent("race_created") {
            param("distance", distance)
        }
    }

    fun logPlanGenerated(raceId: String, totalWeeks: Int) {
        firebaseAnalytics?.logEvent("plan_generated") {
            param("race_id", raceId)
            param("total_weeks", totalWeeks.toLong())
        }
    }

    fun logSessionCompleted(workoutType: String) {
        firebaseAnalytics?.logEvent("session_completed") {
            param("workout_type", workoutType)
        }
    }

    fun logWorkoutLogged() {
        firebaseAnalytics?.logEvent("workout_logged", null)
    }

    fun logCycleDataUpdated() {
        firebaseAnalytics?.logEvent("cycle_data_updated", null)
    }

    fun logPeriodLogged() {
        firebaseAnalytics?.logEvent("period_logged", null)
    }

    fun logSyncTriggered() {
        firebaseAnalytics?.logEvent("sync_triggered", null)
    }

    fun logScreenView(screenName: String) {
        firebaseAnalytics?.logEvent(FirebaseAnalytics.Event.SCREEN_VIEW) {
            param(FirebaseAnalytics.Param.SCREEN_NAME, screenName)
        }
    }

    fun logVoiceSessionStarted(sessionId: String) {
        firebaseAnalytics?.logEvent("voice_session_started") {
            param("session_id", sessionId)
        }
    }

    fun logVoiceSessionCompleted(sessionId: String) {
        firebaseAnalytics?.logEvent("voice_session_completed") {
            param("session_id", sessionId)
        }
    }

    fun logVoiceSessionError(errorType: String) {
        firebaseAnalytics?.logEvent("voice_session_error") {
            param("error_type", errorType)
        }
    }

    fun logError(source: String, errorType: String, message: String?) {
        firebaseAnalytics?.logEvent("app_error") {
            param("source", source)
            param("error_type", errorType)
            if (message != null) {
                param("message", message.take(100))
            }
        }
    }
}
