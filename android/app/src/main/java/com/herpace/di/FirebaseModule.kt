package com.herpace.di

import android.content.Context
import com.google.firebase.analytics.FirebaseAnalytics
import com.herpace.HerPaceApplication
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object FirebaseModule {

    @Provides
    @Singleton
    fun provideFirebaseAnalytics(
        @ApplicationContext context: Context
    ): FirebaseAnalytics? {
        return if (HerPaceApplication.isFirebaseAvailable()) {
            try {
                FirebaseAnalytics.getInstance(context)
            } catch (_: Exception) {
                null
            }
        } else {
            null
        }
    }
}
