package com.herpace.domain.usecase

import com.herpace.data.remote.ApiResult
import com.herpace.data.remote.dto.SignupResponse
import com.herpace.domain.repository.AuthRepository
import javax.inject.Inject

class SignupUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(
        email: String,
        password: String,
        confirmPassword: String
    ): ApiResult<SignupResponse> {
        if (email.isBlank()) {
            return ApiResult.Error(-1, "Email is required")
        }
        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            return ApiResult.Error(-1, "Invalid email format")
        }
        if (password.length < 8) {
            return ApiResult.Error(-1, "Password must be at least 8 characters")
        }
        if (password != confirmPassword) {
            return ApiResult.Error(-1, "Passwords do not match")
        }
        return authRepository.signup(email, password, confirmPassword)
    }
}
