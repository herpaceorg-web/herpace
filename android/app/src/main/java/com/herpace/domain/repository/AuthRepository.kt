package com.herpace.domain.repository

import com.herpace.data.remote.ApiResult
import com.herpace.data.remote.dto.LoginResponse
import com.herpace.data.remote.dto.SignupResponse

interface AuthRepository {
    suspend fun signup(email: String, password: String, confirmPassword: String): ApiResult<SignupResponse>
    suspend fun login(email: String, password: String): ApiResult<LoginResponse>
    suspend fun logout()
    fun isLoggedIn(): Boolean
    fun getCurrentUserId(): String?
}
