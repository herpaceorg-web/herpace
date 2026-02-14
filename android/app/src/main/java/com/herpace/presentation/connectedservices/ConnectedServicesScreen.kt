package com.herpace.presentation.connectedservices

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.browser.customtabs.CustomTabsIntent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
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
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.health.connect.client.PermissionController
import androidx.hilt.navigation.compose.hiltViewModel
import com.herpace.domain.model.ConnectedService
import com.herpace.domain.model.ConnectionStatus
import com.herpace.domain.model.FitnessPlatform
import com.herpace.domain.repository.HealthConnectAvailability
import com.herpace.presentation.common.ErrorMessage
import com.herpace.presentation.common.LoadingIndicator
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ConnectedServicesScreen(
    onNavigateBack: () -> Unit,
    oauthConnected: String? = null,
    oauthError: String? = null,
    oauthPlatform: String? = null,
    viewModel: ConnectedServicesViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    // Handle OAuth result from deep link
    LaunchedEffect(oauthConnected, oauthError) {
        if (oauthConnected != null || oauthError != null) {
            viewModel.handleOAuthResult(oauthConnected, oauthError, oauthPlatform)
        }
    }

    // Launch Chrome Custom Tab when OAuth URL is ready
    LaunchedEffect(uiState.oauthUrl) {
        uiState.oauthUrl?.let { url ->
            val customTabsIntent = CustomTabsIntent.Builder().build()
            customTabsIntent.launchUrl(context, Uri.parse(url))
            viewModel.onOAuthUrlHandled()
        }
    }

    // Health Connect permission launcher
    val permissionLauncher = rememberLauncherForActivityResult(
        contract = PermissionController.createRequestPermissionResultContract()
    ) { granted ->
        viewModel.onHealthConnectPermissionsResult(granted)
    }

    // Trigger permission request when ViewModel signals
    LaunchedEffect(uiState.requestHealthConnectPermissions) {
        if (uiState.requestHealthConnectPermissions) {
            permissionLauncher.launch(viewModel.getHealthConnectPermissions())
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Connected Services") },
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
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            when {
                uiState.isLoading -> {
                    LoadingIndicator()
                }
                uiState.errorMessage != null && uiState.services.isEmpty() -> {
                    ErrorMessage(
                        message = uiState.errorMessage!!,
                        onRetry = { viewModel.loadServices() }
                    )
                }
                else -> {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        item {
                            Text(
                                text = "Link your fitness trackers to automatically import runs.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(bottom = 4.dp)
                            )
                        }

                        // Inline error banner
                        if (uiState.errorMessage != null && uiState.services.isNotEmpty()) {
                            item {
                                Card(
                                    colors = CardDefaults.cardColors(
                                        containerColor = MaterialTheme.colorScheme.errorContainer
                                    ),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(12.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = uiState.errorMessage!!,
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onErrorContainer,
                                            modifier = Modifier.weight(1f)
                                        )
                                        TextButton(onClick = { viewModel.clearError() }) {
                                            Text("Dismiss")
                                        }
                                    }
                                }
                            }
                        }

                        // Success banner
                        if (uiState.successMessage != null) {
                            item {
                                Card(
                                    colors = CardDefaults.cardColors(
                                        containerColor = MaterialTheme.colorScheme.primaryContainer
                                    ),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(12.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = uiState.successMessage!!,
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onPrimaryContainer,
                                            modifier = Modifier.weight(1f)
                                        )
                                        TextButton(onClick = { viewModel.clearSuccess() }) {
                                            Text("Dismiss")
                                        }
                                    }
                                }
                            }
                        }

                        items(uiState.services, key = { it.platform.name }) { service ->
                            ServiceCard(
                                service = service,
                                isSyncing = uiState.syncingPlatform == service.platform.toApiValue(),
                                isConnecting = when (service.platform) {
                                    FitnessPlatform.HEALTH_CONNECT -> uiState.isConnectingHealthConnect
                                    FitnessPlatform.STRAVA, FitnessPlatform.GARMIN -> uiState.isConnectingOAuth
                                    else -> false
                                },
                                healthConnectAvailability = uiState.healthConnectAvailability,
                                onConnect = {
                                    when (service.platform) {
                                        FitnessPlatform.HEALTH_CONNECT -> viewModel.connectHealthConnect()
                                        FitnessPlatform.STRAVA -> viewModel.connectStrava()
                                        FitnessPlatform.GARMIN -> viewModel.connectGarmin()
                                        else -> {}
                                    }
                                },
                                onSync = { viewModel.triggerSync(service.platform.toApiValue()) },
                                onDisconnect = { viewModel.showDisconnectConfirmation(service.platform.toApiValue()) }
                            )
                        }
                    }
                }
            }
        }

        // Disconnect confirmation dialog
        if (uiState.disconnectConfirmPlatform != null) {
            val platformName = uiState.disconnectConfirmPlatform!!
            val service = uiState.services.find { it.platform.toApiValue() == platformName }

            DisconnectDialog(
                platformName = service?.displayName ?: platformName,
                activitiesCount = service?.activitiesImported ?: 0,
                onKeepData = {
                    viewModel.disconnect(platformName, deleteData = false)
                },
                onDeleteData = {
                    viewModel.disconnect(platformName, deleteData = true)
                },
                onDismiss = { viewModel.dismissDisconnectConfirmation() }
            )
        }
    }
}

@Composable
private fun ServiceCard(
    service: ConnectedService,
    isSyncing: Boolean,
    isConnecting: Boolean,
    healthConnectAvailability: HealthConnectAvailability,
    onConnect: () -> Unit,
    onSync: () -> Unit,
    onDisconnect: () -> Unit
) {
    val isConnected = service.status == ConnectionStatus.CONNECTED
    val isTokenExpired = service.status == ConnectionStatus.TOKEN_EXPIRED
    val hasError = service.status == ConnectionStatus.ERROR
    val isHealthConnect = service.platform == FitnessPlatform.HEALTH_CONNECT

    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            // Header: name + status badge
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = service.displayName,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                StatusBadge(status = service.status)
            }

            Spacer(modifier = Modifier.height(12.dp))

            if (isConnected) {
                // Sync status details
                SyncStatusSection(service = service)
                Spacer(modifier = Modifier.height(12.dp))

                // Action buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedButton(
                        onClick = onSync,
                        enabled = !isSyncing
                    ) {
                        if (isSyncing) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(16.dp),
                                strokeWidth = 2.dp
                            )
                        } else {
                            Text("Sync Now")
                        }
                    }

                    TextButton(onClick = onDisconnect) {
                        Text(
                            text = "Disconnect",
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            } else if (isTokenExpired) {
                Text(
                    text = "Your access token has expired. Reconnect to resume syncing.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.error
                )
                Spacer(modifier = Modifier.height(8.dp))
                Button(
                    onClick = onConnect,
                    enabled = !isConnecting
                ) {
                    if (isConnecting) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(16.dp),
                            strokeWidth = 2.dp,
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                    } else {
                        Text("Reconnect")
                    }
                }
            } else if (hasError) {
                Text(
                    text = "There was an error with this connection. Try reconnecting.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.error
                )
                Spacer(modifier = Modifier.height(8.dp))
                Button(
                    onClick = onConnect,
                    enabled = !isConnecting
                ) {
                    if (isConnecting) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(16.dp),
                            strokeWidth = 2.dp,
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                    } else {
                        Text("Reconnect")
                    }
                }
            } else if (isHealthConnect && service.available) {
                // Health Connect specific connect flow
                when (healthConnectAvailability) {
                    HealthConnectAvailability.NOT_INSTALLED -> {
                        Text(
                            text = "Health Connect is not installed on this device.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Button(onClick = onConnect) {
                            Text("Install Health Connect")
                        }
                    }
                    HealthConnectAvailability.NOT_SUPPORTED -> {
                        Text(
                            text = "Health Connect is not supported on this device.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    HealthConnectAvailability.AVAILABLE -> {
                        Text(
                            text = "Connect to import runs from your wearable device.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Button(
                            onClick = onConnect,
                            enabled = !isConnecting
                        ) {
                            if (isConnecting) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(16.dp),
                                    strokeWidth = 2.dp,
                                    color = MaterialTheme.colorScheme.onPrimary
                                )
                            } else {
                                Text("Connect")
                            }
                        }
                    }
                }
            } else if (service.available) {
                // Non-HC platform connect (Strava/Garmin - OAuth via Chrome Custom Tab)
                Text(
                    text = "Connect to import your runs from ${service.displayName}.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(8.dp))
                Button(
                    onClick = onConnect,
                    enabled = !isConnecting
                ) {
                    if (isConnecting) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(16.dp),
                            strokeWidth = 2.dp,
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                    } else {
                        Text("Connect")
                    }
                }
            } else {
                Text(
                    text = "Coming soon",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun SyncStatusSection(service: ConnectedService) {
    val dateFormatter = DateTimeFormatter.ofPattern("MMM d, yyyy")

    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        service.connectedAt?.let { connectedAt ->
            DetailRow(
                label = "Connected",
                value = connectedAt.atZone(ZoneId.systemDefault())
                    .toLocalDate().format(dateFormatter)
            )
        }

        DetailRow(
            label = "Activities",
            value = service.activitiesImported.toString()
        )

        DetailRow(
            label = "Last sync",
            value = service.lastSyncAt?.let { formatRelativeTime(it) } ?: "Never"
        )
    }
}

@Composable
private fun DetailRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodySmall,
            fontWeight = FontWeight.Medium
        )
    }
}

@Composable
private fun StatusBadge(status: ConnectionStatus) {
    val (backgroundColor, textColor, label) = when (status) {
        ConnectionStatus.CONNECTED -> Triple(
            MaterialTheme.colorScheme.primaryContainer,
            MaterialTheme.colorScheme.onPrimaryContainer,
            "Connected"
        )
        ConnectionStatus.TOKEN_EXPIRED -> Triple(
            MaterialTheme.colorScheme.errorContainer,
            MaterialTheme.colorScheme.onErrorContainer,
            "Token Expired"
        )
        ConnectionStatus.ERROR -> Triple(
            MaterialTheme.colorScheme.errorContainer,
            MaterialTheme.colorScheme.onErrorContainer,
            "Error"
        )
        else -> Triple(
            MaterialTheme.colorScheme.surfaceVariant,
            MaterialTheme.colorScheme.onSurfaceVariant,
            "Not Connected"
        )
    }

    Card(
        colors = CardDefaults.cardColors(containerColor = backgroundColor)
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = textColor,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
        )
    }
}

@Composable
private fun DisconnectDialog(
    platformName: String,
    activitiesCount: Int,
    onKeepData: () -> Unit,
    onDeleteData: () -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Disconnect $platformName?") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(
                    text = "Choose what happens to your $activitiesCount imported " +
                        if (activitiesCount == 1) "activity." else "activities."
                )

                OutlinedButton(
                    onClick = onKeepData,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(horizontalAlignment = Alignment.Start) {
                        Text("Keep imported data", fontWeight = FontWeight.Medium)
                        Text(
                            text = "Disconnect but keep all activities in HerPace",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                OutlinedButton(
                    onClick = onDeleteData,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(horizontalAlignment = Alignment.Start) {
                        Text(
                            "Delete all imported data",
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colorScheme.error
                        )
                        Text(
                            text = "Permanently delete all activities from $platformName",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        },
        confirmButton = {},
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

private fun formatRelativeTime(instant: java.time.Instant): String {
    val now = java.time.Instant.now()
    val minutes = ChronoUnit.MINUTES.between(instant, now)
    val hours = ChronoUnit.HOURS.between(instant, now)
    val days = ChronoUnit.DAYS.between(instant, now)

    return when {
        minutes < 1 -> "Just now"
        minutes < 60 -> "${minutes}m ago"
        hours < 24 -> "${hours}h ago"
        days < 7 -> "${days}d ago"
        else -> {
            val formatter = DateTimeFormatter.ofPattern("MMM d")
            instant.atZone(ZoneId.systemDefault()).toLocalDate().format(formatter)
        }
    }
}
