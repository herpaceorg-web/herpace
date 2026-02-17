package com.herpace.util

import android.util.Log
import com.herpace.data.remote.dto.RefreshTokenRequest
import com.herpace.data.remote.dto.RefreshTokenResponse
import com.herpace.data.repository.AuthTokenProvider
import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory
import kotlinx.serialization.json.Json
import okhttp3.Authenticator
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.Route
import retrofit2.Retrofit
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TokenAuthenticator @Inject constructor(
    private val authTokenProvider: AuthTokenProvider,
    private val json: Json,
    private val baseUrl: String
) : Authenticator {

    private val lock = Any()

    override fun authenticate(route: Route?, response: Response): Request? {
        // Don't retry if this is already a refresh call
        if (response.request.url.encodedPath.contains("/api/auth/")) {
            return null
        }

        // Don't retry more than once
        if (responseCount(response) >= 2) {
            return null
        }

        synchronized(lock) {
            val currentToken = authTokenProvider.getToken()
            val requestToken = response.request.header("Authorization")?.removePrefix("Bearer ")

            // Another thread already refreshed - retry with the new token
            if (currentToken != null && currentToken != requestToken) {
                return response.request.newBuilder()
                    .header("Authorization", "Bearer $currentToken")
                    .build()
            }

            val refreshToken = authTokenProvider.getRefreshToken() ?: run {
                Log.w(TAG, "No refresh token available, forcing logout")
                authTokenProvider.clearAuth()
                return null
            }

            return try {
                val newTokens = refreshTokenSync(refreshToken)
                if (newTokens != null) {
                    authTokenProvider.saveToken(newTokens.token)
                    authTokenProvider.saveRefreshToken(newTokens.refreshToken)
                    Log.i(TAG, "Token refreshed successfully")
                    response.request.newBuilder()
                        .header("Authorization", "Bearer ${newTokens.token}")
                        .build()
                } else {
                    Log.w(TAG, "Refresh failed, forcing logout")
                    authTokenProvider.clearAuth()
                    null
                }
            } catch (e: Exception) {
                Log.e(TAG, "Token refresh error", e)
                authTokenProvider.clearAuth()
                null
            }
        }
    }

    private fun refreshTokenSync(refreshToken: String): RefreshTokenResponse? {
        val client = OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .build()

        val retrofit = Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(client)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()

        val api = retrofit.create(RefreshApi::class.java)
        val call = api.refresh(RefreshTokenRequest(refreshToken))
        val result = call.execute()

        return if (result.isSuccessful) result.body() else null
    }

    private fun responseCount(response: Response): Int {
        var count = 1
        var prior = response.priorResponse
        while (prior != null) {
            count++
            prior = prior.priorResponse
        }
        return count
    }

    private interface RefreshApi {
        @retrofit2.http.POST("api/auth/refresh")
        fun refresh(@retrofit2.http.Body request: RefreshTokenRequest): retrofit2.Call<RefreshTokenResponse>
    }

    companion object {
        private const val TAG = "TokenAuthenticator"
    }
}
