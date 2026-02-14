package com.herpace.presentation.races

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.herpace.presentation.common.HerPaceButton
import com.herpace.presentation.common.HerPaceDatePicker
import com.herpace.presentation.common.HerPaceTextField
import com.herpace.presentation.common.RaceDistancePicker

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddEditRaceScreen(
    onNavigateBack: () -> Unit,
    viewModel: AddEditRaceViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(uiState.isSuccess) {
        if (uiState.isSuccess) {
            viewModel.resetSuccess()
            onNavigateBack()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(if (uiState.isEditMode) "Edit Race" else "Add Race")
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back"
                        )
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 24.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Spacer(modifier = Modifier.height(8.dp))

            HerPaceTextField(
                value = uiState.name,
                onValueChange = viewModel::onNameChange,
                label = "Race Name",
                error = uiState.nameError
            )

            HerPaceDatePicker(
                label = "Race Date",
                selectedDate = uiState.date,
                onDateSelected = viewModel::onDateChange,
                error = uiState.dateError
            )

            RaceDistancePicker(
                selectedDistance = uiState.distance,
                onDistanceSelected = viewModel::onDistanceChange
            )

            Text(
                text = "Goal Time (optional)",
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                HerPaceTextField(
                    value = uiState.goalTimeHours,
                    onValueChange = viewModel::onGoalTimeHoursChange,
                    label = "Hours",
                    error = null,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.weight(1f)
                )

                HerPaceTextField(
                    value = uiState.goalTimeMinutes,
                    onValueChange = viewModel::onGoalTimeMinutesChange,
                    label = "Minutes",
                    error = null,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.weight(1f)
                )
            }

            if (uiState.goalTimeError != null) {
                Text(
                    text = uiState.goalTimeError!!,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.error
                )
            }

            if (uiState.errorMessage != null) {
                Text(
                    text = uiState.errorMessage!!,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.error
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            HerPaceButton(
                text = if (uiState.isEditMode) "Update Race" else "Create Race",
                onClick = viewModel::saveRace,
                isLoading = uiState.isLoading,
                enabled = !uiState.isLoading
            )

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}
