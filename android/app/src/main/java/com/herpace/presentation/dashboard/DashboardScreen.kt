package com.herpace.presentation.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.herpace.domain.model.TrainingPlan
import com.herpace.presentation.common.ErrorMessage
import com.herpace.presentation.common.HerPaceButton
import com.herpace.presentation.common.LoadingIndicator
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    onNavigateToRaces: () -> Unit,
    onNavigateToTrainingPlan: () -> Unit,
    onNavigateToSessionDetail: (String) -> Unit = {},
    onNavigateToProfile: () -> Unit = {},
    viewModel: DashboardViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    // T208: Show snackbar when sync conflicts were resolved
    LaunchedEffect(uiState.syncConflictsResolved) {
        if (uiState.syncConflictsResolved > 0) {
            snackbarHostState.showSnackbar(
                "${uiState.syncConflictsResolved} local change(s) replaced with server data"
            )
            viewModel.dismissSyncConflictNotification()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("HerPace") }
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // T209: Offline indicator banner
            if (uiState.isOffline) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(MaterialTheme.colorScheme.errorContainer)
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "You're offline. Some features may be limited.",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onErrorContainer
                    )
                }
            }

            Box(modifier = Modifier.weight(1f)) {
                when {
                    uiState.isLoading -> {
                        LoadingIndicator()
                    }
                    uiState.errorMessage != null && uiState.activePlan == null -> {
                        ErrorMessage(
                            message = uiState.errorMessage!!,
                            onRetry = viewModel::loadDashboard
                        )
                    }
                    else -> {
                        DashboardContent(
                            uiState = uiState,
                            onNavigateToRaces = onNavigateToRaces,
                            onNavigateToTrainingPlan = onNavigateToTrainingPlan,
                            onNavigateToSessionDetail = onNavigateToSessionDetail
                        )
                    }
                }
            }
        }

        // Gentle period reminder dialog
        if (uiState.showPeriodReminder) {
            AlertDialog(
                onDismissRequest = viewModel::dismissPeriodReminder,
                title = { Text("Update Your Cycle Info") },
                text = {
                    Text(
                        "It's been ${uiState.daysSinceLastPeriod} days since you last " +
                            "logged your period start. Keeping this up to date helps HerPace " +
                            "optimize your training plan for your cycle."
                    )
                },
                confirmButton = {
                    Button(onClick = {
                        viewModel.dismissPeriodReminder()
                        onNavigateToProfile()
                    }) {
                        Text("Update Now")
                    }
                },
                dismissButton = {
                    TextButton(onClick = viewModel::dismissPeriodReminder) {
                        Text("Later")
                    }
                }
            )
        }
    }
}

@Composable
private fun DashboardContent(
    uiState: DashboardUiState,
    onNavigateToRaces: () -> Unit,
    onNavigateToTrainingPlan: () -> Unit,
    onNavigateToSessionDetail: (String) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        if (uiState.todaySession != null) {
            Column {
                Text(
                    text = "Today's Workout",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(8.dp))
                TodayWorkoutCard(
                    session = uiState.todaySession,
                    onClick = { onNavigateToSessionDetail(uiState.todaySession.id) }
                )
            }
        } else if (uiState.activePlan != null) {
            NoWorkoutTodayCard()
        }

        if (uiState.activePlan != null) {
            PlanSummaryCard(
                plan = uiState.activePlan,
                onViewPlan = onNavigateToTrainingPlan
            )
        } else {
            NoPlanCard(onNavigateToRaces = onNavigateToRaces)
        }

        QuickActionsRow(
            hasPlan = uiState.activePlan != null,
            onNavigateToRaces = onNavigateToRaces,
            onNavigateToTrainingPlan = onNavigateToTrainingPlan
        )

        SyncStatusRow(
            lastSyncTimeMillis = uiState.lastSyncTimeMillis,
            pendingSyncCount = uiState.pendingSyncCount
        )
    }
}

@Composable
private fun SyncStatusRow(
    lastSyncTimeMillis: Long?,
    pendingSyncCount: Int
) {
    val syncText = if (lastSyncTimeMillis != null) {
        val formatter = DateTimeFormatter.ofPattern("MMM d, h:mm a")
        val syncTime = Instant.ofEpochMilli(lastSyncTimeMillis)
            .atZone(ZoneId.systemDefault())
            .toLocalDateTime()
        "Last synced: ${syncTime.format(formatter)}"
    } else {
        "Not yet synced"
    }

    val pendingText = if (pendingSyncCount > 0) {
        " | $pendingSyncCount pending"
    } else {
        ""
    }

    Text(
        text = syncText + pendingText,
        style = MaterialTheme.typography.labelSmall,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        modifier = Modifier.fillMaxWidth(),
        textAlign = TextAlign.Center
    )
}

@Composable
private fun NoWorkoutTodayCard() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "No Workout Today",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "Enjoy your rest day!",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun PlanSummaryCard(
    plan: TrainingPlan,
    onViewPlan: () -> Unit
) {
    val totalSessions = plan.sessions.size
    val completedSessions = plan.sessions.count { it.completed }
    val totalDistance = plan.sessions.sumOf { it.distanceKm ?: 0.0 }
    val dateFormatter = DateTimeFormatter.ofPattern("MMM d")

    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Training Plan",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                TextButton(onClick = onViewPlan) {
                    Text("View Plan")
                }
            }

            Text(
                text = "${plan.startDate.format(dateFormatter)} – ${plan.endDate.format(dateFormatter)}",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(8.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                Text(
                    text = "${plan.totalWeeks} weeks",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.primary
                )
                Text(
                    text = "$completedSessions/$totalSessions sessions",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = "${String.format("%.0f", totalDistance)} km",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun NoPlanCard(onNavigateToRaces: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "No Active Training Plan",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Create a race and generate a personalized training plan to get started.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(16.dp))
            HerPaceButton(
                text = "View Races",
                onClick = onNavigateToRaces
            )
        }
    }
}

@Composable
private fun QuickActionsRow(
    hasPlan: Boolean,
    onNavigateToRaces: () -> Unit,
    onNavigateToTrainingPlan: () -> Unit
) {
    Column {
        Text(
            text = "Quick Actions",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(8.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Card(
                onClick = onNavigateToRaces,
                modifier = Modifier.weight(1f).semantics {
                    contentDescription = "My Races. Tap to view your races."
                },
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "My Races",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }

            if (hasPlan) {
                Card(
                    onClick = onNavigateToTrainingPlan,
                    modifier = Modifier.weight(1f).semantics {
                        contentDescription = "Full Plan. Tap to view your training plan."
                    },
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "Full Plan",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }
        }
    }
}
