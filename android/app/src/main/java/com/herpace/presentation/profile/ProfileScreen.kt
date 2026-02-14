package com.herpace.presentation.profile

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.FitnessCenter
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
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
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.herpace.domain.model.CyclePhase
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    onNavigateBack: () -> Unit,
    onNavigateToCycleTracking: () -> Unit,
    onNavigateToConnectedServices: () -> Unit,
    onNavigateToNotificationSettings: () -> Unit,
    onLogout: () -> Unit,
    viewModel: ProfileViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(uiState.periodLogSuccess) {
        if (uiState.periodLogSuccess) {
            snackbarHostState.showSnackbar("Period start logged for today")
            viewModel.clearPeriodLogSuccess()
        }
    }

    LaunchedEffect(uiState.errorMessage) {
        uiState.errorMessage?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearError()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Profile") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        if (uiState.isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else if (uiState.profile != null) {
            val profile = uiState.profile!!
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(16.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Profile Info Card
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.primaryContainer
                    )
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            Icons.Filled.Person,
                            contentDescription = "Profile picture",
                            modifier = Modifier.size(48.dp),
                            tint = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                        Spacer(modifier = Modifier.width(16.dp))
                        Column {
                            Text(
                                text = profile.name,
                                style = MaterialTheme.typography.headlineSmall,
                                color = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                            Text(
                                text = "Age ${profile.age} | ${profile.fitnessLevel.displayName}",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f)
                            )
                        }
                    }
                }

                // Running Stats Card
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp)
                    ) {
                        Text(
                            text = "Running Stats",
                            style = MaterialTheme.typography.titleMedium
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        ProfileDetailRow("Weekly Mileage", "${profile.currentWeeklyMileage} km")
                        ProfileDetailRow("Fitness Level", profile.fitnessLevel.displayName)
                    }
                }

                // Cycle Info Card
                Card(
                    modifier = Modifier.fillMaxWidth().semantics {
                        contentDescription = "Cycle tracking. Tap to edit cycle data."
                    },
                    onClick = onNavigateToCycleTracking
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
                                text = "Cycle Tracking",
                                style = MaterialTheme.typography.titleMedium
                            )
                            Icon(
                                Icons.AutoMirrored.Filled.ArrowForward,
                                contentDescription = "Edit cycle data",
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        if (uiState.currentCyclePhase != null) {
                            CyclePhaseChip(uiState.currentCyclePhase!!, uiState.dayInCycle)
                            Spacer(modifier = Modifier.height(8.dp))
                        }
                        ProfileDetailRow("Cycle Length", "${profile.cycleLength} days")
                        ProfileDetailRow(
                            "Last Period",
                            profile.lastPeriodStartDate.format(DateTimeFormatter.ofPattern("MMM d, yyyy"))
                        )
                    }
                }

                // Log Period Start Quick Action
                Button(
                    onClick = viewModel::showLogPeriodConfirmation,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Log Period Start (Today)")
                }

                // Notification Settings Card
                Card(
                    modifier = Modifier.fillMaxWidth().semantics {
                        contentDescription = "Notification settings. Tap to configure."
                    },
                    onClick = onNavigateToNotificationSettings
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                Icons.Filled.Notifications,
                                contentDescription = "Notifications",
                                tint = MaterialTheme.colorScheme.primary
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Text(
                                text = "Notification Settings",
                                style = MaterialTheme.typography.titleMedium
                            )
                        }
                        Icon(
                            Icons.AutoMirrored.Filled.ArrowForward,
                            contentDescription = "Go to notification settings",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                // Connected Services Card
                Card(
                    modifier = Modifier.fillMaxWidth().semantics {
                        contentDescription = "Connected services. Tap to manage fitness tracker connections."
                    },
                    onClick = onNavigateToConnectedServices
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                Icons.Filled.FitnessCenter,
                                contentDescription = "Connected services",
                                tint = MaterialTheme.colorScheme.primary
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Text(
                                text = "Connected Services",
                                style = MaterialTheme.typography.titleMedium
                            )
                        }
                        Icon(
                            Icons.AutoMirrored.Filled.ArrowForward,
                            contentDescription = "Go to connected services",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                // Sync Card
                Card(modifier = Modifier.fillMaxWidth()) {
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
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "Data Sync",
                                    style = MaterialTheme.typography.titleMedium
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                val syncText = if (uiState.lastSyncTimeMillis != null) {
                                    val formatter = DateTimeFormatter.ofPattern("MMM d, h:mm a")
                                    val syncTime = Instant.ofEpochMilli(uiState.lastSyncTimeMillis!!)
                                        .atZone(ZoneId.systemDefault())
                                        .toLocalDateTime()
                                    "Last synced: ${syncTime.format(formatter)}"
                                } else {
                                    "Not yet synced"
                                }
                                Text(
                                    text = syncText,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                if (uiState.pendingSyncCount > 0) {
                                    Text(
                                        text = "${uiState.pendingSyncCount} changes pending",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                }
                            }
                            IconButton(
                                onClick = viewModel::syncNow,
                                enabled = !uiState.isSyncing
                            ) {
                                if (uiState.isSyncing) {
                                    CircularProgressIndicator(
                                        modifier = Modifier.size(24.dp),
                                        strokeWidth = 2.dp
                                    )
                                } else {
                                    Icon(
                                        Icons.Filled.Refresh,
                                        contentDescription = "Sync now",
                                        tint = MaterialTheme.colorScheme.primary
                                    )
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Logout Button
                OutlinedButton(
                    onClick = {
                        viewModel.logout()
                        onLogout()
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Log Out")
                }
            }
        } else {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = uiState.errorMessage ?: "No profile found",
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.error
                )
            }
        }

        // Log Period Confirmation Dialog
        if (uiState.showLogPeriodConfirmation) {
            AlertDialog(
                onDismissRequest = viewModel::dismissLogPeriodConfirmation,
                title = { Text("Log Period Start") },
                text = {
                    Text("Set today as the start of your current period? This will update your cycle tracking and recalculate training adjustments.")
                },
                confirmButton = {
                    Button(onClick = viewModel::logPeriodStart) {
                        Text("Confirm")
                    }
                },
                dismissButton = {
                    TextButton(onClick = viewModel::dismissLogPeriodConfirmation) {
                        Text("Cancel")
                    }
                }
            )
        }
    }
}

@Composable
private fun ProfileDetailRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium
        )
    }
}

@Composable
private fun CyclePhaseChip(phase: CyclePhase, dayInCycle: Int?) {
    val phaseColor = when (phase) {
        CyclePhase.MENSTRUAL -> MaterialTheme.colorScheme.error
        CyclePhase.FOLLICULAR -> MaterialTheme.colorScheme.primary
        CyclePhase.OVULATORY -> MaterialTheme.colorScheme.tertiary
        CyclePhase.LUTEAL -> MaterialTheme.colorScheme.secondary
    }

    Card(
        colors = CardDefaults.cardColors(containerColor = phaseColor.copy(alpha = 0.15f))
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "${phase.displayName} Phase",
                style = MaterialTheme.typography.labelLarge,
                color = phaseColor
            )
            if (dayInCycle != null) {
                Text(
                    text = " - Day $dayInCycle",
                    style = MaterialTheme.typography.labelMedium,
                    color = phaseColor.copy(alpha = 0.7f)
                )
            }
        }
    }
}
