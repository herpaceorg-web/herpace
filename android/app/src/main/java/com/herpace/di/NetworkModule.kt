package com.herpace.di

import com.herpace.BuildConfig
import com.herpace.data.remote.HerPaceApiService
import com.herpace.data.repository.AuthTokenProvider
import com.herpace.data.repository.AuthTokenProviderImpl
import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import kotlinx.serialization.json.Json
import okhttp3.CertificatePinner
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideJson(): Json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        coerceInputValues = true
    }

    @Provides
    @Singleton
    fun provideOkHttpClient(
        authTokenProvider: AuthTokenProvider
    ): OkHttpClient {
        val builder = OkHttpClient.Builder()
            .addInterceptor { chain ->
                val request = chain.request().newBuilder()
                val token = authTokenProvider.getToken()
                if (token != null && !chain.request().url.encodedPath.contains("/api/auth/")) {
                    request.addHeader("Authorization", "Bearer $token")
                }
                chain.proceed(request.build())
            }
            .addInterceptor(
                HttpLoggingInterceptor().apply {
                    level = if (BuildConfig.DEBUG) {
                        HttpLoggingInterceptor.Level.BODY
                    } else {
                        HttpLoggingInterceptor.Level.NONE
                    }
                }
            )
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(4, TimeUnit.MINUTES)
            .writeTimeout(30, TimeUnit.SECONDS)

        // Certificate pinning for production builds only
        if (!BuildConfig.DEBUG) {
            val certificatePinner = CertificatePinner.Builder()
                // Google Cloud Run production API domain
                // Pins against Google Trust Services root CAs
                .add(
                    "*.us-central1.run.app",
                    "sha256/hxqRlPTu1bMS/0DITB1SSu0vd4u/8l8TjPgfaAp63Gc=", // GTS Root R1
                    "sha256/Vfd95BwDeSQo+NUYxVEEIBvvpOs/uqXEoSRMAOVo7R0="  // GTS Root R2
                )
                .build()
            builder.certificatePinner(certificatePinner)
        }

        return builder.build()
    }

    @Provides
    @Singleton
    fun provideRetrofit(
        okHttpClient: OkHttpClient,
        json: Json
    ): Retrofit {
        return Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
    }

    @Provides
    @Singleton
    fun provideHerPaceApiService(retrofit: Retrofit): HerPaceApiService {
        return retrofit.create(HerPaceApiService::class.java)
    }
}

@Module
@InstallIn(SingletonComponent::class)
abstract class AuthModule {

    @Binds
    @Singleton
    abstract fun bindAuthTokenProvider(
        impl: AuthTokenProviderImpl
    ): AuthTokenProvider
}
