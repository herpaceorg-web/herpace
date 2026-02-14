package com.herpace.domain.model

enum class CyclePhase(val displayName: String) {
    MENSTRUAL("Menstrual"),
    FOLLICULAR("Follicular"),
    OVULATORY("Ovulatory"),
    LUTEAL("Luteal");

    companion object {
        fun fromApiValue(value: String): CyclePhase {
            return entries.firstOrNull { it.displayName.equals(value, ignoreCase = true) }
                ?: MENSTRUAL
        }
    }
}
