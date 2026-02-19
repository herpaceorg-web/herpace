package com.herpace.di

import com.herpace.data.repository.AuthRepositoryImpl
import com.herpace.data.repository.ProfileRepositoryImpl
import com.herpace.data.repository.RaceRepositoryImpl
import com.herpace.data.repository.ResearchRepositoryImpl
import com.herpace.data.repository.TrainingPlanRepositoryImpl
import com.herpace.data.repository.NotificationRepositoryImpl
import com.herpace.data.repository.WorkoutLogRepositoryImpl
import com.herpace.domain.repository.AuthRepository
import com.herpace.domain.repository.NotificationRepository
import com.herpace.domain.repository.ProfileRepository
import com.herpace.domain.repository.RaceRepository
import com.herpace.domain.repository.ResearchRepository
import com.herpace.domain.repository.TrainingPlanRepository
import com.herpace.domain.repository.WorkoutLogRepository
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds
    @Singleton
    abstract fun bindAuthRepository(impl: AuthRepositoryImpl): AuthRepository

    @Binds
    @Singleton
    abstract fun bindProfileRepository(impl: ProfileRepositoryImpl): ProfileRepository

    @Binds
    @Singleton
    abstract fun bindRaceRepository(impl: RaceRepositoryImpl): RaceRepository

    @Binds
    @Singleton
    abstract fun bindTrainingPlanRepository(impl: TrainingPlanRepositoryImpl): TrainingPlanRepository

    @Binds
    @Singleton
    abstract fun bindWorkoutLogRepository(impl: WorkoutLogRepositoryImpl): WorkoutLogRepository

    @Binds
    @Singleton
    abstract fun bindNotificationRepository(impl: NotificationRepositoryImpl): NotificationRepository

    @Binds
    @Singleton
    abstract fun bindResearchRepository(impl: ResearchRepositoryImpl): ResearchRepository
}
