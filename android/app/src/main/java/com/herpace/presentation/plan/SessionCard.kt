package com.herpace.presentation.plan

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
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
import com.herpace.domain.model.WorkoutType
import com.herpace.presentation.common.CyclePhaseIndicator
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.Locale

@Composable
fun SessionCard(
    session: TrainingSession,
    onClick: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    val dateFormatter = DateTimeFormatter.ofPattern("MMM d")
    val dayName = session.dayOfWeek.getDisplayName(TextStyle.SHORT, Locale.getDefault())

    val sessionDescription = buildString {
        append("$dayName, ${session.date.format(dateFormatter)}")
        append(". ${session.workoutType.displayName}")
        if (session.distanceKm != null) append(", ${String.format("%.1f", session.distanceKm)} km")
        if (session.completed) append(", completed")
        append(". Tap for details.")
    }

    Card(
        onClick = onClick,
        modifier = modifier.fillMaxWidth().semantics { contentDescription = sessionDescription },
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        colors = if (session.completed) {
            CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
            )
        } else {
            CardDefaults.cardColors()
        }
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = dayName,
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = session.date.format(dateFormatter),
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    CyclePhaseIndicator(cyclePhase = session.cyclePhase)
                    if (session.completed) {
                        Icon(
                            imageVector = Icons.Default.CheckCircle,
                            contentDescription = "Completed",
                            tint = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = session.workoutType.displayName,
                    style = MaterialTheme.typography.titleSmall,
                    color = if (session.workoutType == WorkoutType.REST_DAY) {
                        MaterialTheme.colorScheme.onSurfaceVariant
                    } else {
                        MaterialTheme.colorScheme.onSurface
                    }
                )

                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    if (session.distanceKm != null) {
                        Text(
                            text = "${String.format("%.1f", session.distanceKm)} km",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                    Text(
                        text = session.intensityLevel.rpeRange,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            if (session.targetPaceMinPerKm != null) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Target: ${formatPace(session.targetPaceMinPerKm)} /km",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            if (!session.notes.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = session.notes,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 2
                )
            }
        }
    }
}

private fun formatPace(minPerKm: Double): String {
    val minutes = minPerKm.toInt()
    val seconds = ((minPerKm - minutes) * 60).toInt()
    return "${minutes}:${seconds.toString().padStart(2, '0')}"
}
