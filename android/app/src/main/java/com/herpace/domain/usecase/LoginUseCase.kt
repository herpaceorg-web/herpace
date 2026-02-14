package com.herpace.domain.usecase

import com.herpace.data.remote.ApiResult
import com.herpace.data.remote.dto.LoginResponse
import com.herpace.domain.repository.AuthRepository
import javax.inject.Inject

class LoginUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(email: String, password: String): ApiResult<LoginResponse> {
        if (email.isBlank()) {
            return ApiResult.Error(-1, "Email is required")
        }
        if (password.isBlank()) {
            return ApiResult.Error(-1, "Password is required")
        }
        return authRepository.login(email, password)
    }
}
