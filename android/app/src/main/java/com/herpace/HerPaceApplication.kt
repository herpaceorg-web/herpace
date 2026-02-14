package com.herpace

import android.app.Application
import android.util.Log
import com.google.firebase.FirebaseApp
import com.google.firebase.crashlytics.FirebaseCrashlytics
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class HerPaceApplication : Application() {

    override fun onCreate() {
        super.onCreate()

        if (initializeFirebase()) {
            FirebaseCrashlytics.getInstance()
                .setCrashlyticsCollectionEnabled(!BuildConfig.DEBUG)

            val defaultHandler = Thread.getDefaultUncaughtExceptionHandler()
            Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
                Log.e("HerPace", "Uncaught exception", throwable)
                try {
                    FirebaseCrashlytics.getInstance().recordException(throwable)
                } catch (_: Exception) { }
                defaultHandler?.uncaughtException(thread, throwable)
            }
        }
    }

    private fun initializeFirebase(): Boolean {
        return try {
            FirebaseApp.initializeApp(this)
            FirebaseApp.getInstance()
            Log.d("HerPace", "Firebase initialized successfully")
            true
        } catch (e: Exception) {
            Log.w("HerPace", "Firebase not available (missing or invalid google-services.json): ${e.message}")
            false
        }
    }

    companion object {
        fun isFirebaseAvailable(): Boolean {
            return try {
                FirebaseApp.getInstance()
                true
            } catch (_: Exception) {
                false
            }
        }
    }
}
