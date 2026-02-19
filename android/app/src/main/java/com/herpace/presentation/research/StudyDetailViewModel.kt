package com.herpace.presentation.research

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.herpace.domain.model.ResearchStudyDetail
import com.herpace.domain.repository.ResearchRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class StudyDetailUiState(
    val study: ResearchStudyDetail? = null,
    val isLoading: Boolean = true,
    val error: String? = null
)

@HiltViewModel
class StudyDetailViewModel @Inject constructor(
    private val researchRepository: ResearchRepository,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val _uiState = MutableStateFlow(StudyDetailUiState())
    val uiState: StateFlow<StudyDetailUiState> = _uiState.asStateFlow()

    init {
        val studyId = savedStateHandle.get<Int>("studyId") ?: 0
        if (studyId > 0) {
            loadStudy(studyId)
        } else {
            _uiState.update { it.copy(isLoading = false, error = "Invalid study ID") }
        }
    }

    private fun loadStudy(id: Int) {
        viewModelScope.launch {
            try {
                val study = researchRepository.getStudy(id)
                _uiState.update { it.copy(study = study, isLoading = false) }
            } catch (e: Exception) {
                _uiState.update { it.copy(error = "Failed to load study", isLoading = false) }
            }
        }
    }
}
