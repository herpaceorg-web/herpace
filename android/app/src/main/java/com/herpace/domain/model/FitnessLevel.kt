package com.herpace.domain.model

enum class FitnessLevel(val displayName: String) {
    BEGINNER("Beginner"),
    INTERMEDIATE("Intermediate"),
    ADVANCED("Advanced");

    companion object {
        fun fromApiValue(value: String): FitnessLevel {
            return entries.firstOrNull { it.displayName.equals(value, ignoreCase = true) }
                ?: BEGINNER
        }
    }
}
