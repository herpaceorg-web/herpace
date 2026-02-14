package com.herpace.di

import com.herpace.data.repository.VoiceCoachRepositoryImpl
import com.herpace.data.voice.GeminiWebSocketManager
import com.herpace.domain.repository.VoiceCoachRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import java.util.concurrent.TimeUnit
import javax.inject.Qualifier
import javax.inject.Singleton

@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class GeminiOkHttpClient

@Module
@InstallIn(SingletonComponent::class)
abstract class VoiceCoachModule {

    @Binds
    @Singleton
    abstract fun bindVoiceCoachRepository(
        impl: VoiceCoachRepositoryImpl
    ): VoiceCoachRepository

    companion object {
        @Provides
        @Singleton
        @GeminiOkHttpClient
        fun provideGeminiOkHttpClient(): OkHttpClient {
            // Separate OkHttpClient for Gemini WebSocket — no auth interceptor.
            // Gemini authenticates via API key in the WebSocket URL.
            return OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(0, TimeUnit.SECONDS) // No read timeout for WebSocket
                .writeTimeout(30, TimeUnit.SECONDS)
                .pingInterval(30, TimeUnit.SECONDS) // Keep WebSocket alive
                .build()
        }

        @Provides
        @Singleton
        fun provideGeminiWebSocketManager(
            @GeminiOkHttpClient okHttpClient: OkHttpClient
        ): GeminiWebSocketManager {
            return GeminiWebSocketManager(okHttpClient)
        }
    }
}
