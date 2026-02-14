package com.herpace.domain.model

enum class IntensityLevel(val displayName: String, val rpeRange: String) {
    LOW("Low", "RPE 3-4"),
    MODERATE("Moderate", "RPE 5-6"),
    HIGH("High", "RPE 7-8");

    companion object {
        fun fromApiValue(value: String): IntensityLevel {
            return entries.firstOrNull { it.displayName.equals(value, ignoreCase = true) }
                ?: LOW
        }
    }
}
