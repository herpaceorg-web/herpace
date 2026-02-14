package com.herpace.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.herpace.data.local.dao.FitnessTrackerDao
import com.herpace.data.local.dao.NotificationScheduleDao
import com.herpace.data.local.dao.RaceDao
import com.herpace.data.local.dao.RunnerProfileDao
import com.herpace.data.local.dao.TrainingPlanDao
import com.herpace.data.local.dao.TrainingSessionDao
import com.herpace.data.local.dao.UserDao
import com.herpace.data.local.dao.WorkoutLogDao
import com.herpace.data.local.entity.ImportedActivityEntity
import com.herpace.data.local.entity.NotificationScheduleEntity
import com.herpace.data.local.entity.RaceEntity
import com.herpace.data.local.entity.RunnerProfileEntity
import com.herpace.data.local.entity.TrainingPlanEntity
import com.herpace.data.local.entity.TrainingSessionEntity
import com.herpace.data.local.entity.UserEntity
import com.herpace.data.local.entity.WorkoutLogEntity

@Database(
    entities = [
        UserEntity::class,
        RunnerProfileEntity::class,
        RaceEntity::class,
        TrainingPlanEntity::class,
        TrainingSessionEntity::class,
        WorkoutLogEntity::class,
        NotificationScheduleEntity::class,
        ImportedActivityEntity::class
    ],
    version = 4,
    exportSchema = true
)
@TypeConverters(Converters::class)
abstract class HerPaceDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
    abstract fun runnerProfileDao(): RunnerProfileDao
    abstract fun raceDao(): RaceDao
    abstract fun trainingPlanDao(): TrainingPlanDao
    abstract fun trainingSessionDao(): TrainingSessionDao
    abstract fun workoutLogDao(): WorkoutLogDao
    abstract fun notificationScheduleDao(): NotificationScheduleDao
    abstract fun fitnessTrackerDao(): FitnessTrackerDao

    companion object {
        const val DATABASE_NAME = "herpace_database"
    }
}
