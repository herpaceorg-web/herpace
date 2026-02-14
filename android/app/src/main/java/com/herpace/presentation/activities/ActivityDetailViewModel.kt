package com.herpace.presentation.activities

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.herpace.data.remote.ApiResult
import com.herpace.data.remote.HerPaceApiService
import com.herpace.data.remote.safeApiCall
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ActivityDetailViewModel @Inject constructor(
    private val apiService: HerPaceApiService,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val activityId: String = savedStateHandle.get<String>("activityId") ?: ""

    private val _uiState = MutableStateFlow(ActivityDetailUiState())
    val uiState: StateFlow<ActivityDetailUiState> = _uiState.asStateFlow()

    init {
        if (activityId.isNotEmpty()) {
            loadActivityDetail()
        }
    }

    fun loadActivityDetail() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }

            when (val result = safeApiCall { apiService.getActivityDetail(activityId) }) {
                is ApiResult.Success -> {
                    _uiState.update {
                        it.copy(
                            activity = result.data.toDomain(),
                            isLoading = false
                        )
                    }
                }
                is ApiResult.Error -> {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = result.message ?: "Failed to load activity"
                        )
                    }
                }
                is ApiResult.NetworkError -> {
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
}
