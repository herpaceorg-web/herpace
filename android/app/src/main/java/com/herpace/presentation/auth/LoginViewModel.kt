package com.herpace.presentation.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.herpace.data.remote.ApiResult
import com.herpace.domain.usecase.LoginUseCase
import com.herpace.util.AnalyticsHelper
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val loginUseCase: LoginUseCase,
    private val analyticsHelper: AnalyticsHelper
) : ViewModel() {

    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    fun onEmailChange(email: String) {
        _uiState.update { it.copy(email = email, emailError = null, errorMessage = null) }
    }

    fun onPasswordChange(password: String) {
        _uiState.update { it.copy(password = password, passwordError = null, errorMessage = null) }
    }

    fun login() {
        val state = _uiState.value
        if (!validateFields(state)) return

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }

            when (val result = loginUseCase(state.email.trim(), state.password)) {
                is ApiResult.Success -> {
                    analyticsHelper.logLogin()
                    _uiState.update { it.copy(isLoading = false, isSuccess = true) }
                }
                is ApiResult.Error -> {
                    analyticsHelper.logError("login", "api_error", result.message)
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = result.message ?: "Login failed"
                        )
                    }
                }
                is ApiResult.NetworkError -> {
                    analyticsHelper.logError("login", "network_error", null)
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = "Network error. Please check your connection."
                        )
                    }
                }
            }
        }
    }

    fun clearError() {
        _uiState.update { it.copy(errorMessage = null) }
    }

    fun resetSuccess() {
        _uiState.update { it.copy(isSuccess = false) }
    }

    private fun validateFields(state: AuthUiState): Boolean {
        var valid = true

        if (state.email.isBlank()) {
            _uiState.update { it.copy(emailError = "Email is required") }
            valid = false
        }

        if (state.password.isBlank()) {
            _uiState.update { it.copy(passwordError = "Password is required") }
            valid = false
        }

        return valid
    }
}
