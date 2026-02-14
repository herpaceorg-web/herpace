package com.herpace.data.local

import androidx.room.TypeConverter
import com.herpace.domain.model.CyclePhase
import com.herpace.domain.model.FitnessLevel
import com.herpace.domain.model.FitnessPlatform
import com.herpace.domain.model.IntensityLevel
import com.herpace.domain.model.RaceDistance
import com.herpace.domain.model.WorkoutType
import java.time.DayOfWeek
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime

class Converters {

    // Instant
    @TypeConverter
    fun fromInstant(value: Instant?): Long? = value?.toEpochMilli()

    @TypeConverter
    fun toInstant(value: Long?): Instant? = value?.let { Instant.ofEpochMilli(it) }

    // LocalDate
    @TypeConverter
    fun fromLocalDate(value: LocalDate?): String? = value?.toString()

    @TypeConverter
    fun toLocalDate(value: String?): LocalDate? = value?.let { LocalDate.parse(it) }

    // LocalTime
    @TypeConverter
    fun fromLocalTime(value: LocalTime?): String? = value?.toString()

    @TypeConverter
    fun toLocalTime(value: String?): LocalTime? = value?.let { LocalTime.parse(it) }

    // DayOfWeek
    @TypeConverter
    fun fromDayOfWeek(value: DayOfWeek): String = value.name

    @TypeConverter
    fun toDayOfWeek(value: String): DayOfWeek = DayOfWeek.valueOf(value)

    // SyncStatus
    @TypeConverter
    fun fromSyncStatus(value: SyncStatus): String = value.name

    @TypeConverter
    fun toSyncStatus(value: String): SyncStatus = SyncStatus.valueOf(value)

    // FitnessLevel
    @TypeConverter
    fun fromFitnessLevel(value: FitnessLevel): String = value.name

    @TypeConverter
    fun toFitnessLevel(value: String): FitnessLevel = FitnessLevel.valueOf(value)

    // RaceDistance
    @TypeConverter
    fun fromRaceDistance(value: RaceDistance): String = value.name

    @TypeConverter
    fun toRaceDistance(value: String): RaceDistance = RaceDistance.valueOf(value)

    // WorkoutType
    @TypeConverter
    fun fromWorkoutType(value: WorkoutType): String = value.name

    @TypeConverter
    fun toWorkoutType(value: String): WorkoutType = WorkoutType.valueOf(value)

    // IntensityLevel
    @TypeConverter
    fun fromIntensityLevel(value: IntensityLevel): String = value.name

    @TypeConverter
    fun toIntensityLevel(value: String): IntensityLevel = IntensityLevel.valueOf(value)

    // CyclePhase
    @TypeConverter
    fun fromCyclePhase(value: CyclePhase): String = value.name

    @TypeConverter
    fun toCyclePhase(value: String): CyclePhase = CyclePhase.valueOf(value)

    // FitnessPlatform
    @TypeConverter
    fun fromFitnessPlatform(value: FitnessPlatform?): String? = value?.name

    @TypeConverter
    fun toFitnessPlatform(value: String?): FitnessPlatform? = value?.let { FitnessPlatform.valueOf(it) }
}
