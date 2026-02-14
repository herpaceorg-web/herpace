package com.herpace.di

import com.herpace.data.repository.HealthConnectRepositoryImpl
import com.herpace.domain.repository.HealthConnectRepository
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class FitnessTrackerModule {

    @Binds
    @Singleton
    abstract fun bindHealthConnectRepository(
        impl: HealthConnectRepositoryImpl
    ): HealthConnectRepository
}
