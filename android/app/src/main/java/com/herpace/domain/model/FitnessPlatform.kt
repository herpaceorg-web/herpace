package com.herpace.domain.model

enum class FitnessPlatform(val displayName: String) {
    STRAVA("Strava"),
    GARMIN("Garmin"),
    HEALTH_CONNECT("Health Connect");

    companion object {
        fun fromApiValue(value: String): FitnessPlatform {
            return when (value) {
                "Strava" -> STRAVA
                "Garmin" -> GARMIN
                "HealthConnect" -> HEALTH_CONNECT
                else -> entries.firstOrNull { it.displayName.equals(value, ignoreCase = true) }
                    ?: HEALTH_CONNECT
            }
        }
    }

    fun toApiValue(): String = when (this) {
        STRAVA -> "Strava"
        GARMIN -> "Garmin"
        HEALTH_CONNECT -> "HealthConnect"
    }
}
