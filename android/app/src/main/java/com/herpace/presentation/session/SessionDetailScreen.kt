package com.herpace.presentation.session

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
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.DirectionsRun
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
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
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.herpace.domain.model.CyclePhase
import com.herpace.domain.model.TrainingSession
import com.herpace.domain.model.WorkoutLog
import com.herpace.domain.model.WorkoutType
import com.herpace.presentation.common.CyclePhaseIndicator
import com.herpace.presentation.common.ErrorMessage
import com.herpace.presentation.common.HerPaceButton
import com.herpace.presentation.common.LoadingIndicator
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SessionDetailScreen(
    onNavigateBack: () -> Unit,
    onNavigateToVoiceCoach: () -> Unit = {},
    viewModel: SessionDetailViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Workout Details") },
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
                uiState.errorMessage != null && uiState.session == null -> {
                    ErrorMessage(
                        message = uiState.errorMessage!!,
                        onRetry = viewModel::loadSession
                    )
                }
                uiState.session != null -> {
                    SessionDetailContent(
                        session = uiState.session!!,
                        workoutLog = uiState.workoutLog,
                        isMarkingComplete = uiState.isMarkingComplete,
                        onMarkCompleted = viewModel::markCompleted,
                        onUndoCompletion = viewModel::undoCompletion,
                        onLogWorkout = viewModel::showLogWorkoutDialog,
                        onVoiceCoach = onNavigateToVoiceCoach
                    )
                }
            }

            // Log Workout Dialog
            if (uiState.showLogWorkoutDialog) {
                LogWorkoutDialog(
                    isLoading = uiState.isLoggingWorkout,
                    onDismiss = viewModel::dismissLogWorkoutDialog,
                    onSubmit = { distance, duration, effort, notes ->
                        viewModel.logWorkoutDetails(distance, duration, effort, notes)
                    }
                )
            }
        }
    }
}

@Composable
private fun SessionDetailContent(
    session: TrainingSession,
    workoutLog: WorkoutLog?,
    isMarkingComplete: Boolean,
    onMarkCompleted: () -> Unit,
    onUndoCompletion: () -> Unit,
    onLogWorkout: () -> Unit,
    onVoiceCoach: () -> Unit
) {
    val dateFormatter = DateTimeFormatter.ofPattern("EEEE, MMMM d, yyyy")
    val isRestDay = session.workoutType == WorkoutType.REST_DAY

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Date and completion status header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = session.date.format(dateFormatter),
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            if (session.completed) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.CheckCircle,
                        contentDescription = "Completed",
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = "Completed",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }
        }

        // Workout type headline
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Icon(
                imageVector = Icons.Default.DirectionsRun,
                contentDescription = "Workout type",
                tint = MaterialTheme.colorScheme.primary
            )
            Text(
                text = session.workoutType.displayName,
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold
            )
        }

        // Rest day card
        if (isRestDay) {
            RestDayCard(cyclePhase = session.cyclePhase)
        } else {
            // Workout details card
            WorkoutDetailsCard(session = session)
        }

        // Cycle phase card
        CyclePhaseCard(cyclePhase = session.cyclePhase)

        // Notes card
        if (!session.notes.isNullOrBlank()) {
            NotesCard(notes = session.notes)
        }

        // Workout log card (if logged)
        if (workoutLog != null) {
            WorkoutLogCard(log = workoutLog)
        }

        // Action buttons
        if (!isRestDay) {
            Spacer(modifier = Modifier.height(8.dp))

            if (!session.completed) {
                HerPaceButton(
                    text = "Mark as Completed",
                    onClick = onMarkCompleted,
                    isLoading = isMarkingComplete
                )
            } else {
                // Completed session actions
                Column(
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    if (workoutLog == null) {
                        HerPaceButton(
                            text = "Log Workout Details",
                            onClick = onLogWorkout
                        )
                        OutlinedButton(
                            onClick = onVoiceCoach,
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.outlinedButtonColors(
                                contentColor = MaterialTheme.colorScheme.primary
                            )
                        ) {
                            Icon(
                                imageVector = Icons.Default.Mic,
                                contentDescription = null,
                                modifier = Modifier.padding(end = 8.dp)
                            )
                            Text("Voice Coach")
                        }
                    }
                    OutlinedButton(
                        onClick = onUndoCompletion,
                        enabled = !isMarkingComplete,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(if (isMarkingComplete) "Undoing..." else "Undo Completion")
                    }
                }
            }
        }
    }
}

@Composable
private fun WorkoutDetailsCard(session: TrainingSession) {
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
                text = "Workout Details",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )

            if (session.distanceKm != null) {
                DetailRow(label = "Distance", value = "${String.format("%.1f", session.distanceKm)} km")
            }

            DetailRow(
                label = "Intensity",
                value = "${session.intensityLevel.displayName} (${session.intensityLevel.rpeRange})"
            )

            if (session.targetPaceMinPerKm != null) {
                val minutes = session.targetPaceMinPerKm.toInt()
                val seconds = ((session.targetPaceMinPerKm - minutes) * 60).toInt()
                DetailRow(
                    label = "Target Pace",
                    value = "${minutes}:${seconds.toString().padStart(2, '0')} /km"
                )
            }

            DetailRow(
                label = "Week",
                value = "Week ${session.weekNumber}"
            )

            DetailRow(
                label = "Day",
                value = session.dayOfWeek.getDisplayName(TextStyle.FULL, Locale.getDefault())
            )
        }
    }
}

@Composable
private fun RestDayCard(cyclePhase: CyclePhase) {
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
                text = "Recovery Day",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )

            Text(
                text = recoveryGuidance(cyclePhase),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun CyclePhaseCard(cyclePhase: CyclePhase) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = "Cycle Phase",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )

            CyclePhaseIndicator(cyclePhase = cyclePhase)

            Text(
                text = cyclePhaseDescription(cyclePhase),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun NotesCard(notes: String) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = "Notes",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = notes,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun WorkoutLogCard(log: WorkoutLog) {
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
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "Your Performance",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )

            if (log.actualDistanceKm > 0) {
                DetailRow(
                    label = "Actual Distance",
                    value = "${String.format("%.1f", log.actualDistanceKm)} km"
                )
            }

            if (log.actualDurationMinutes > 0) {
                val hours = log.actualDurationMinutes / 60
                val mins = log.actualDurationMinutes % 60
                val durationText = if (hours > 0) "${hours}h ${mins}m" else "${mins}m"
                DetailRow(label = "Duration", value = durationText)
            }

            DetailRow(
                label = "Perceived Effort",
                value = "${log.perceivedEffort}/10"
            )

            if (!log.notes.isNullOrBlank()) {
                Text(
                    text = log.notes,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
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

private fun recoveryGuidance(cyclePhase: CyclePhase): String = when (cyclePhase) {
    CyclePhase.MENSTRUAL -> "Focus on gentle movement like walking or yoga. Stay hydrated and listen to your body. This is a great time for active recovery."
    CyclePhase.FOLLICULAR -> "Your energy is building. Use this rest day for light stretching or foam rolling to prepare for higher-intensity sessions ahead."
    CyclePhase.OVULATORY -> "Energy is at its peak. Consider light cross-training like swimming or cycling if you feel restless, but prioritize recovery."
    CyclePhase.LUTEAL -> "Your body may need extra rest during this phase. Focus on gentle stretching, hydration, and quality sleep."
}

private fun cyclePhaseDescription(cyclePhase: CyclePhase): String = when (cyclePhase) {
    CyclePhase.MENSTRUAL -> "During the menstrual phase, energy levels may be lower. Training intensity is adapted to support your body's needs."
    CyclePhase.FOLLICULAR -> "The follicular phase brings rising energy and improved endurance. A great time for building fitness."
    CyclePhase.OVULATORY -> "Peak energy and strength during ovulation. Your body is primed for higher-intensity workouts."
    CyclePhase.LUTEAL -> "The luteal phase may bring reduced energy. Training is adjusted with moderate intensity to match your body's rhythm."
}
