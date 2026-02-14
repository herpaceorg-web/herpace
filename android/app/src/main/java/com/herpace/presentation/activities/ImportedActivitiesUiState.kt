package com.herpace.presentation.activities

import com.herpace.domain.model.ImportedActivity

data class ImportedActivitiesUiState(
    val activities: List<ImportedActivity> = emptyList(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val currentPage: Int = 1,
    val totalPages: Int = 1,
    val totalItems: Int = 0
)

data class ActivityDetailUiState(
    val activity: ImportedActivity? = null,
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)
