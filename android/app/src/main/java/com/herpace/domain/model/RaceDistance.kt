package com.herpace.domain.model

enum class RaceDistance(val displayName: String, val distanceKm: Double) {
    FIVE_K("5K", 5.0),
    TEN_K("10K", 10.0),
    HALF_MARATHON("Half Marathon", 21.1),
    MARATHON("Marathon", 42.2);

    companion object {
        fun fromApiValue(value: String): RaceDistance {
            return when (value) {
                "FiveK", "5K" -> FIVE_K
                "TenK", "10K" -> TEN_K
                "HalfMarathon", "Half Marathon" -> HALF_MARATHON
                "Marathon" -> MARATHON
                else -> entries.firstOrNull { it.displayName.equals(value, ignoreCase = true) }
                    ?: FIVE_K
            }
        }
    }

    fun toApiValue(): String = when (this) {
        FIVE_K -> "FiveK"
        TEN_K -> "TenK"
        HALF_MARATHON -> "HalfMarathon"
        MARATHON -> "Marathon"
    }
}
