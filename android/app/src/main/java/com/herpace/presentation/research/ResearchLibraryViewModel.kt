package com.herpace.presentation.research

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.herpace.domain.model.ResearchStudySummary
import com.herpace.domain.repository.ResearchRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ResearchLibraryUiState(
    val studies: List<ResearchStudySummary> = emptyList(),
    val categories: List<String> = emptyList(),
    val isLoading: Boolean = true,
    val error: String? = null,
    val searchQuery: String = "",
    val selectedCategory: String? = null,
    val selectedTier: String? = null,
    val selectedPhase: String? = null
)

@HiltViewModel
class ResearchLibraryViewModel @Inject constructor(
    private val researchRepository: ResearchRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ResearchLibraryUiState())
    val uiState: StateFlow<ResearchLibraryUiState> = _uiState.asStateFlow()

    private var searchJob: Job? = null

    init {
        loadCategories()
        loadStudies()
    }

    private fun loadCategories() {
        viewModelScope.launch {
            try {
                val categories = researchRepository.getCategories()
                _uiState.update { it.copy(categories = categories) }
            } catch (_: Exception) {
                // Categories are optional
            }
        }
    }

    fun loadStudies() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val state = _uiState.value
                val studies = researchRepository.getStudies(
                    category = state.selectedCategory,
                    tier = state.selectedTier,
                    search = state.searchQuery.takeIf { it.isNotBlank() },
                    phase = state.selectedPhase
                )
                _uiState.update { it.copy(studies = studies, isLoading = false) }
            } catch (e: Exception) {
                _uiState.update { it.copy(error = "Failed to load studies", isLoading = false) }
            }
        }
    }

    fun onSearchQueryChanged(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
        searchJob?.cancel()
        searchJob = viewModelScope.launch {
            delay(300)
            loadStudies()
        }
    }

    fun onCategorySelected(category: String?) {
        _uiState.update {
            it.copy(selectedCategory = if (it.selectedCategory == category) null else category)
        }
        loadStudies()
    }

    fun onTierSelected(tier: String?) {
        _uiState.update {
            it.copy(selectedTier = if (it.selectedTier == tier) null else tier)
        }
        loadStudies()
    }

    fun onPhaseSelected(phase: String?) {
        _uiState.update {
            it.copy(selectedPhase = if (it.selectedPhase == phase) null else phase)
        }
        loadStudies()
    }

    fun clearFilters() {
        _uiState.update {
            it.copy(
                searchQuery = "",
                selectedCategory = null,
                selectedTier = null,
                selectedPhase = null
            )
        }
        loadStudies()
    }
}
