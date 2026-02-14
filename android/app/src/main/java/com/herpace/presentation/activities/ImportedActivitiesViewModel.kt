package com.herpace.presentation.activities

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
class ImportedActivitiesViewModel @Inject constructor(
    private val apiService: HerPaceApiService
) : ViewModel() {

    private val _uiState = MutableStateFlow(ImportedActivitiesUiState())
    val uiState: StateFlow<ImportedActivitiesUiState> = _uiState.asStateFlow()

    init {
        loadActivities()
    }

    fun loadActivities(page: Int = 1) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }

            when (val result = safeApiCall { apiService.getImportedActivities(page = page) }) {
                is ApiResult.Success -> {
                    val data = result.data
                    _uiState.update {
                        it.copy(
                            activities = data.activities.map { a -> a.toDomain() },
                            currentPage = data.pagination.page,
                            totalPages = data.pagination.totalPages,
                            totalItems = data.pagination.totalItems,
                            isLoading = false
                        )
                    }
                }
                is ApiResult.Error -> {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = result.message ?: "Failed to load activities"
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

    fun nextPage() {
        val state = _uiState.value
        if (state.currentPage < state.totalPages) {
            loadActivities(state.currentPage + 1)
        }
    }

    fun previousPage() {
        val state = _uiState.value
        if (state.currentPage > 1) {
            loadActivities(state.currentPage - 1)
        }
    }
}
