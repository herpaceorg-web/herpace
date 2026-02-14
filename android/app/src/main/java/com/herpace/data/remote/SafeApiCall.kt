package com.herpace.data.remote

import android.util.Log
import com.google.firebase.crashlytics.FirebaseCrashlytics
import com.herpace.HerPaceApplication
import retrofit2.HttpException
import java.io.IOException
import java.net.SocketTimeoutException

suspend fun <T> safeApiCall(apiCall: suspend () -> T): ApiResult<T> {
    return try {
        ApiResult.Success(apiCall())
    } catch (e: HttpException) {
        val errorBody = try {
            e.response()?.errorBody()?.string()
        } catch (_: Exception) {
            null
        }
        val message = parseErrorMessage(errorBody) ?: e.message()

        // Log server errors (5xx) to Crashlytics
        if (e.code() >= 500) {
            logToCrashlytics("API server error: ${e.code()} ${e.response()?.raw()?.request?.url}", e)
        }
        Log.w("SafeApiCall", "HTTP ${e.code()}: $message")

        ApiResult.Error(e.code(), message)
    } catch (e: SocketTimeoutException) {
        Log.w("SafeApiCall", "Request timed out", e)
        logToCrashlytics("API timeout: ${e.message}")
        ApiResult.NetworkError
    } catch (e: IOException) {
        Log.w("SafeApiCall", "Network error: ${e.message}")
        ApiResult.NetworkError
    } catch (e: Exception) {
        Log.e("SafeApiCall", "Unexpected API error", e)
        logToCrashlytics(null, e)
        ApiResult.Error(-1, e.message)
    }
}

private fun logToCrashlytics(message: String?, exception: Exception? = null) {
    if (!HerPaceApplication.isFirebaseAvailable()) return
    try {
        val crashlytics = FirebaseCrashlytics.getInstance()
        if (message != null) crashlytics.log(message)
        if (exception != null) crashlytics.recordException(exception)
    } catch (_: Exception) { }
}

private fun parseErrorMessage(errorBody: String?): String? {
    if (errorBody.isNullOrBlank()) return null
    return try {
        val json = kotlinx.serialization.json.Json { ignoreUnknownKeys = true }
        val element = json.parseToJsonElement(errorBody)
        val obj = element as? kotlinx.serialization.json.JsonObject ?: return errorBody
        (obj["message"] as? kotlinx.serialization.json.JsonPrimitive)?.content
            ?: (obj["title"] as? kotlinx.serialization.json.JsonPrimitive)?.content
            ?: errorBody
    } catch (_: Exception) {
        errorBody
    }
}
