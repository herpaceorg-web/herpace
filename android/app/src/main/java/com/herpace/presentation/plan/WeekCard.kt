package com.herpace.presentation.plan

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.key
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.herpace.domain.model.TrainingSession
import com.herpace.domain.model.WorkoutType

@Composable
fun WeekCard(
    weekNumber: Int,
    sessions: List<TrainingSession>,
    onSessionClick: (String) -> Unit = {},
    modifier: Modifier = Modifier
) {
    val totalDistance = sessions.sumOf { it.distanceKm ?: 0.0 }
    val completedCount = sessions.count { it.completed }
    val workoutCount = sessions.count { it.workoutType != WorkoutType.REST_DAY }

    Column(modifier = modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 4.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Week $weekNumber",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )

            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                Text(
                    text = "${String.format("%.1f", totalDistance)} km",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.primary
                )
                Text(
                    text = "$completedCount/$workoutCount done",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        if (workoutCount > 0) {
            Spacer(modifier = Modifier.height(4.dp))
            LinearProgressIndicator(
                progress = { completedCount.toFloat() / workoutCount },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 4.dp),
                trackColor = MaterialTheme.colorScheme.surfaceVariant,
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            sessions.forEach { session ->
                key(session.id) {
                    SessionCard(
                        session = session,
                        onClick = { onSessionClick(session.id) }
                    )
                }
            }
        }
    }
}
