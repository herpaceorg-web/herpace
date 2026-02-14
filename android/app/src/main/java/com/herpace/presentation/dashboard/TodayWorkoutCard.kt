package com.herpace.presentation.dashboard

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.DirectionsRun
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.herpace.domain.model.TrainingSession
import com.herpace.presentation.common.CyclePhaseIndicator
import java.time.format.DateTimeFormatter

@Composable
fun TodayWorkoutCard(
    session: TrainingSession,
    onClick: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    val dateFormatter = DateTimeFormatter.ofPattern("EEEE, MMM d")

    val cardDescription = buildString {
        append("${session.workoutType.displayName} workout")
        if (session.distanceKm != null) append(", ${String.format("%.1f", session.distanceKm)} km")
        append(", ${session.intensityLevel.displayName} intensity")
        if (session.completed) append(", completed")
        append(". Tap for details.")
    }

    Card(
        onClick = onClick,
        modifier = modifier.fillMaxWidth().semantics { contentDescription = cardDescription },
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        colors = if (session.completed) {
            CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
            )
        } else {
            CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.primaryContainer
            )
        }
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
                    text = session.date.format(dateFormatter),
                    style = MaterialTheme.typography.labelMedium,
                    color = if (session.completed) {
                        MaterialTheme.colorScheme.onSurfaceVariant
                    } else {
                        MaterialTheme.colorScheme.onPrimaryContainer
                    }
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
                            text = "Done",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.DirectionsRun,
                    contentDescription = "Workout type",
                    tint = if (session.completed) {
                        MaterialTheme.colorScheme.onSurfaceVariant
                    } else {
                        MaterialTheme.colorScheme.onPrimaryContainer
                    }
                )
                Text(
                    text = session.workoutType.displayName,
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    color = if (session.completed) {
                        MaterialTheme.colorScheme.onSurfaceVariant
                    } else {
                        MaterialTheme.colorScheme.onPrimaryContainer
                    }
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                if (session.distanceKm != null) {
                    Column {
                        Text(
                            text = "Distance",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = "${String.format("%.1f", session.distanceKm)} km",
                            style = MaterialTheme.typography.bodyLarge,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
                Column {
                    Text(
                        text = "Intensity",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "${session.intensityLevel.displayName} (${session.intensityLevel.rpeRange})",
                        style = MaterialTheme.typography.bodyLarge,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }

            if (session.targetPaceMinPerKm != null) {
                Spacer(modifier = Modifier.height(8.dp))
                Column {
                    Text(
                        text = "Target Pace",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    val minutes = session.targetPaceMinPerKm.toInt()
                    val seconds = ((session.targetPaceMinPerKm - minutes) * 60).toInt()
                    Text(
                        text = "${minutes}:${seconds.toString().padStart(2, '0')} /km",
                        style = MaterialTheme.typography.bodyLarge,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            CyclePhaseIndicator(cyclePhase = session.cyclePhase)

            if (!session.notes.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = session.notes,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}
