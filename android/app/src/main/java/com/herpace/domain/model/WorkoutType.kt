package com.herpace.domain.model

enum class WorkoutType(val displayName: String) {
    EASY_RUN("Easy Run"),
    LONG_RUN("Long Run"),
    TEMPO_RUN("Tempo Run"),
    INTERVALS("Intervals"),
    REST_DAY("Rest Day");

    companion object {
        fun fromApiValue(value: String): WorkoutType {
            return when (value) {
                "EasyRun" -> EASY_RUN
                "LongRun" -> LONG_RUN
                "TempoRun" -> TEMPO_RUN
                "Intervals" -> INTERVALS
                "RestDay" -> REST_DAY
                else -> entries.firstOrNull { it.displayName.equals(value, ignoreCase = true) }
                    ?: EASY_RUN
            }
        }
    }

    fun toApiValue(): String = when (this) {
        EASY_RUN -> "EasyRun"
        LONG_RUN -> "LongRun"
        TEMPO_RUN -> "TempoRun"
        INTERVALS -> "Intervals"
        REST_DAY -> "RestDay"
    }
}
