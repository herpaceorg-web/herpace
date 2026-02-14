package com.herpace.presentation.plan

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.herpace.presentation.common.ErrorMessage
import com.herpace.presentation.common.LoadingIndicator

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TrainingPlanScreen(
    onNavigateBack: () -> Unit,
    onNavigateToSessionDetail: (String) -> Unit = {},
    raceId: String? = null,
    viewModel: TrainingPlanViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Training Plan") },
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
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when {
                uiState.isGenerating -> {
                    GeneratingPlanContent()
                }
                uiState.isLoading -> {
                    LoadingIndicator()
                }
                uiState.errorMessage != null && uiState.plan == null -> {
                    ErrorMessage(
                        message = uiState.errorMessage!!,
                        onRetry = viewModel::retry
                    )
                }
                uiState.plan != null -> {
                    PlanContent(
                        uiState = uiState,
                        onWeekSelected = viewModel::selectWeek,
                        onSessionClick = onNavigateToSessionDetail
                    )
                }
                else -> {
                    NoPlanContent(
                        raceId = raceId,
                        onGeneratePlan = { id -> viewModel.generatePlan(id) }
                    )
                }
            }
        }
    }
}

@Composable
private fun GeneratingPlanContent() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "Generating Your Plan",
            style = MaterialTheme.typography.headlineSmall,
            color = MaterialTheme.colorScheme.primary
        )

        Spacer(modifier = Modifier.height(16.dp))

        LinearProgressIndicator(
            modifier = Modifier.fillMaxWidth(0.7f)
        )

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "Our AI is creating a personalized training plan adapted to your cycle phases. This may take 2\u20134 minutes.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )
    }
}

@Composable
private fun PlanContent(
    uiState: TrainingPlanUiState,
    onWeekSelected: (Int) -> Unit,
    onSessionClick: (String) -> Unit
) {
    val plan = uiState.plan ?: return
    val totalWeeks = plan.totalWeeks

    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            PlanHeader(uiState = uiState)
        }

        item {
            WeekSelector(
                totalWeeks = totalWeeks,
                selectedWeek = uiState.selectedWeek,
                onWeekSelected = onWeekSelected
            )
        }

        val weekSessions = uiState.sessionsByWeek[uiState.selectedWeek] ?: emptyList()
        item {
            WeekCard(
                weekNumber = uiState.selectedWeek,
                sessions = weekSessions,
                onSessionClick = onSessionClick
            )
        }
    }
}

@Composable
private fun PlanHeader(uiState: TrainingPlanUiState) {
    val plan = uiState.plan ?: return
    val totalSessions = plan.sessions.size
    val completedSessions = plan.sessions.count { it.completed }
    val totalDistance = plan.sessions.sumOf { it.distanceKm ?: 0.0 }
    val progress = if (totalSessions > 0) completedSessions.toFloat() / totalSessions else 0f

    Column(modifier = Modifier.fillMaxWidth()) {
        Text(
            text = "${plan.totalWeeks}-Week Training Plan",
            style = MaterialTheme.typography.titleLarge
        )

        Spacer(modifier = Modifier.height(4.dp))

        Text(
            text = "${plan.startDate} to ${plan.endDate}",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "$completedSessions/$totalSessions sessions | ${String.format("%.0f", totalDistance)} km total",
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.primary
        )

        Spacer(modifier = Modifier.height(8.dp))

        LinearProgressIndicator(
            progress = { progress },
            modifier = Modifier.fillMaxWidth(),
            trackColor = MaterialTheme.colorScheme.surfaceVariant,
        )
    }
}

@Composable
private fun WeekSelector(
    totalWeeks: Int,
    selectedWeek: Int,
    onWeekSelected: (Int) -> Unit
) {
    LazyRow(
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(totalWeeks, key = { it }) { index ->
            val weekNumber = index + 1
            FilterChip(
                selected = weekNumber == selectedWeek,
                onClick = { onWeekSelected(weekNumber) },
                label = { Text("W$weekNumber") }
            )
        }
    }
}

@Composable
private fun NoPlanContent(
    raceId: String?,
    onGeneratePlan: (String) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "No Active Training Plan",
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "Generate a plan from one of your races to get started.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )

        if (raceId != null) {
            Spacer(modifier = Modifier.height(24.dp))
            com.herpace.presentation.common.HerPaceButton(
                text = "Generate Plan",
                onClick = { onGeneratePlan(raceId) }
            )
        }
    }
}
