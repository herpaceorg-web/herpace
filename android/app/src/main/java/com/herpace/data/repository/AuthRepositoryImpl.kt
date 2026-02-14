package com.herpace.data.repository

import com.herpace.data.local.dao.UserDao
import com.herpace.data.local.entity.UserEntity
import com.herpace.data.remote.ApiResult
import com.herpace.data.remote.HerPaceApiService
import com.herpace.data.remote.dto.LoginRequest
import com.herpace.data.remote.dto.LoginResponse
import com.herpace.data.remote.dto.SignupRequest
import com.herpace.data.remote.dto.SignupResponse
import com.herpace.data.remote.safeApiCall
import com.herpace.domain.repository.AuthRepository
import java.time.Instant
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepositoryImpl @Inject constructor(
    private val apiService: HerPaceApiService,
    private val authTokenProvider: AuthTokenProvider,
    private val userDao: UserDao
) : AuthRepository {

    override suspend fun signup(
        email: String,
        password: String,
        confirmPassword: String
    ): ApiResult<SignupResponse> {
        val result = safeApiCall {
            apiService.signup(SignupRequest(email, password, confirmPassword))
        }
        if (result is ApiResult.Success) {
            authTokenProvider.saveToken(result.data.token)
            authTokenProvider.saveUserId(result.data.userId)
            userDao.insert(
                UserEntity(
                    id = result.data.userId,
                    email = result.data.email,
                    createdAt = Instant.now()
                )
            )
        }
        return result
    }

    override suspend fun login(email: String, password: String): ApiResult<LoginResponse> {
        val result = safeApiCall {
            apiService.login(LoginRequest(email, password))
        }
        if (result is ApiResult.Success) {
            authTokenProvider.saveToken(result.data.token)
            authTokenProvider.saveUserId(result.data.userId)
            userDao.insert(
                UserEntity(
                    id = result.data.userId,
                    email = result.data.email,
                    createdAt = Instant.now()
                )
            )
        }
        return result
    }

    override suspend fun logout() {
        val userId = authTokenProvider.getUserId()
        authTokenProvider.clearAuth()
        if (userId != null) {
            userDao.deleteById(userId)
        }
    }

    override fun isLoggedIn(): Boolean = authTokenProvider.isLoggedIn()

    override fun getCurrentUserId(): String? = authTokenProvider.getUserId()
}
