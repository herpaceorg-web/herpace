package com.herpace.domain.model

import java.time.Instant

data class ConnectedService(
    val platform: FitnessPlatform,
    val displayName: String,
    val status: ConnectionStatus,
    val externalUserId: String?,
    val connectedAt: Instant?,
    val lastSyncAt: Instant?,
    val activitiesImported: Int,
    val available: Boolean
)

enum class ConnectionStatus(val displayName: String) {
    CONNECTED("Connected"),
    NOT_CONNECTED("Not Connected"),
    DISCONNECTED("Disconnected"),
    TOKEN_EXPIRED("Token Expired"),
    ERROR("Error");

    companion object {
        fun fromApiValue(value: String): ConnectionStatus = when (value) {
            "Connected" -> CONNECTED
            "NotConnected" -> NOT_CONNECTED
            "Disconnected" -> DISCONNECTED
            "TokenExpired" -> TOKEN_EXPIRED
            "Error" -> ERROR
            else -> NOT_CONNECTED
        }
    }
}
