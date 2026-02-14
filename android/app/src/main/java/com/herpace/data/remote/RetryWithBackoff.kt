package com.herpace.data.remote

import android.util.Log
import kotlinx.coroutines.delay
import retrofit2.HttpException
import java.io.IOException

/**
 * Executes an API call with retry logic and exponential backoff.
 *
 * Retries on:
 * - Network errors (IOException)
 * - Server errors (HTTP 5xx)
 * - HTTP 429 Too Many Requests
 *
 * Does NOT retry on:
 * - Client errors (HTTP 4xx, except 429)
 * - Other unexpected exceptions
 *
 * @param maxRetries Maximum number of retry attempts (default 3)
 * @param initialDelayMs Initial delay before first retry in milliseconds (default 1000)
 * @param maxDelayMs Maximum delay cap in milliseconds (default 10000)
 * @param backoffMultiplier Multiplier for exponential backoff (default 2.0)
 * @param apiCall The suspend function to execute
 */
suspend fun <T> safeApiCallWithRetry(
    maxRetries: Int = 3,
    initialDelayMs: Long = 1000,
    maxDelayMs: Long = 10000,
    backoffMultiplier: Double = 2.0,
    apiCall: suspend () -> T
): ApiResult<T> {
    var currentDelay = initialDelayMs
    var lastResult: ApiResult<T>? = null

    repeat(maxRetries + 1) { attempt ->
        val result = safeApiCall(apiCall)

        when {
            result is ApiResult.Success -> return result

            result is ApiResult.NetworkError && attempt < maxRetries -> {
                Log.d("RetryWithBackoff", "Network error, retrying (attempt ${attempt + 1}/$maxRetries) after ${currentDelay}ms")
                delay(currentDelay)
                currentDelay = (currentDelay * backoffMultiplier).toLong().coerceAtMost(maxDelayMs)
            }

            result is ApiResult.Error && isRetryableHttpError(result.code) && attempt < maxRetries -> {
                Log.d("RetryWithBackoff", "HTTP ${result.code}, retrying (attempt ${attempt + 1}/$maxRetries) after ${currentDelay}ms")
                delay(currentDelay)
                currentDelay = (currentDelay * backoffMultiplier).toLong().coerceAtMost(maxDelayMs)
            }

            else -> return result
        }

        lastResult = result
    }

    return lastResult ?: ApiResult.Error(-1, "Retry exhausted")
}

private fun isRetryableHttpError(code: Int): Boolean =
    code in 500..599 || code == 429
