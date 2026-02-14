package com.herpace.presentation.activities

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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.herpace.domain.model.ImportedActivity
import com.herpace.presentation.common.ErrorMessage
import com.herpace.presentation.common.LoadingIndicator
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ImportedActivityDetailScreen(
    onNavigateBack: () -> Unit,
    viewModel: ActivityDetailViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Activity Details") },
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
                uiState.isLoading -> {
                    LoadingIndicator()
                }
                uiState.errorMessage != null && uiState.activity == null -> {
                    ErrorMessage(
                        message = uiState.errorMessage!!,
                        onRetry = viewModel::loadActivityDetail
                    )
                }
                uiState.activity != null -> {
                    ActivityDetailContent(activity = uiState.activity!!)
                }
            }
        }
    }
}

@Composable
private fun ActivityDetailContent(activity: ImportedActivity) {
    val dateFormatter = DateTimeFormatter.ofPattern("EEEE, MMMM d, yyyy")
    val timeFormatter = DateTimeFormatter.ofPattern("h:mm a")
    val zonedDate = activity.activityDate.atZone(ZoneId.systemDefault())

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Header
        Column {
            Text(
                text = activity.activityTitle ?: activity.activityType,
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = zonedDate.toLocalDate().format(dateFormatter),
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = "${zonedDate.toLocalTime().format(timeFormatter)} · ${activity.platform.displayName}",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        // Key Metrics card
        KeyMetricsCard(activity)

        // Heart Rate & Cadence card
        if (activity.averageHeartRate != null || activity.maxHeartRate != null || activity.cadence != null) {
            HeartRateCadenceCard(activity)
        }

        // Elevation & Energy card
        if (activity.elevationGainMeters != null || activity.caloriesBurned != null) {
            ElevationEnergyCard(activity)
        }

        // GPS Route card
        if (activity.hasGpsRoute) {
            GpsRouteCard()
        }

        // Matched Training Session card
        if (activity.matchedTrainingSessionId != null) {
            MatchedSessionCard(activity.matchedTrainingSessionId)
        }
    }
}

@Composable
private fun KeyMetricsCard(activity: ImportedActivity) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "Key Metrics",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )

            activity.distanceKm?.let {
                DetailRow(label = "Distance", value = "%.2f km".format(it))
            }

            activity.formattedDuration?.let {
                DetailRow(label = "Duration", value = it)
            }

            activity.formattedPace?.let {
                DetailRow(label = "Avg Pace", value = it)
            }

            activity.movingTimeSeconds?.let { seconds ->
                val h = seconds / 3600
                val m = (seconds % 3600) / 60
                val s = seconds % 60
                val formatted = if (h > 0) "$h:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}"
                else "$m:${s.toString().padStart(2, '0')}"
                DetailRow(label = "Moving Time", value = formatted)
            }
        }
    }
}

@Composable
private fun HeartRateCadenceCard(activity: ImportedActivity) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "Heart Rate & Cadence",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )

            activity.averageHeartRate?.let {
                DetailRow(label = "Avg Heart Rate", value = "$it bpm")
            }

            activity.maxHeartRate?.let {
                DetailRow(label = "Max Heart Rate", value = "$it bpm")
            }

            activity.cadence?.let {
                DetailRow(label = "Cadence", value = "$it spm")
            }
        }
    }
}

@Composable
private fun ElevationEnergyCard(activity: ImportedActivity) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "Elevation & Energy",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )

            activity.elevationGainMeters?.let {
                DetailRow(label = "Elevation Gain", value = "%.0f m".format(it))
            }

            activity.caloriesBurned?.let {
                DetailRow(label = "Calories", value = "$it kcal")
            }
        }
    }
}

@Composable
private fun GpsRouteCard() {
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
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = "GPS Route",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "Route map will be available in a future update.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun MatchedSessionCard(sessionId: String) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.3f)
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = "Matched Training Session",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "This activity has been linked to a training session in your plan.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
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
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.SemiBold
        )
    }
}
