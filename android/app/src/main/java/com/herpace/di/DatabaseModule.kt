package com.herpace.di

import android.content.Context
import android.content.SharedPreferences
import android.util.Base64
import androidx.room.Room
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys
import com.herpace.data.local.HerPaceDatabase
import com.herpace.data.local.dao.RaceDao
import com.herpace.data.local.dao.RunnerProfileDao
import com.herpace.data.local.dao.TrainingPlanDao
import com.herpace.data.local.dao.TrainingSessionDao
import com.herpace.data.local.dao.UserDao
import com.herpace.data.local.dao.NotificationScheduleDao
import com.herpace.data.local.dao.WorkoutLogDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import net.sqlcipher.database.SupportFactory
import java.security.SecureRandom
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    private const val DB_KEY_PREFS = "herpace_db_key_prefs"
    private const val DB_KEY = "sqlcipher_key"
    private const val DB_KEY_LENGTH = 32

    /**
     * Retrieves or generates a random SQLCipher passphrase stored in
     * EncryptedSharedPreferences (backed by Android Keystore).
     */
    private fun getOrCreateDbPassphrase(context: Context): ByteArray {
        val masterKeyAlias = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC)
        val prefs: SharedPreferences = EncryptedSharedPreferences.create(
            DB_KEY_PREFS,
            masterKeyAlias,
            context,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )

        val existing = prefs.getString(DB_KEY, null)
        if (existing != null) {
            return Base64.decode(existing, Base64.NO_WRAP)
        }

        val key = ByteArray(DB_KEY_LENGTH)
        SecureRandom().nextBytes(key)
        prefs.edit().putString(DB_KEY, Base64.encodeToString(key, Base64.NO_WRAP)).apply()
        return key
    }

    @Provides
    @Singleton
    fun provideDatabase(
        @ApplicationContext context: Context
    ): HerPaceDatabase {
        val passphrase = getOrCreateDbPassphrase(context)
        val factory = SupportFactory(passphrase)

        return Room.databaseBuilder(
            context,
            HerPaceDatabase::class.java,
            HerPaceDatabase.DATABASE_NAME
        )
            .openHelperFactory(factory)
            .fallbackToDestructiveMigration()
            .build()
    }

    @Provides
    fun provideUserDao(database: HerPaceDatabase): UserDao = database.userDao()

    @Provides
    fun provideRunnerProfileDao(database: HerPaceDatabase): RunnerProfileDao = database.runnerProfileDao()

    @Provides
    fun provideRaceDao(database: HerPaceDatabase): RaceDao = database.raceDao()

    @Provides
    fun provideTrainingPlanDao(database: HerPaceDatabase): TrainingPlanDao = database.trainingPlanDao()

    @Provides
    fun provideTrainingSessionDao(database: HerPaceDatabase): TrainingSessionDao = database.trainingSessionDao()

    @Provides
    fun provideWorkoutLogDao(database: HerPaceDatabase): WorkoutLogDao = database.workoutLogDao()

    @Provides
    fun provideNotificationScheduleDao(database: HerPaceDatabase): NotificationScheduleDao = database.notificationScheduleDao()
}
