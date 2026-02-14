package com.herpace.presentation.session

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp

@Composable
fun LogWorkoutDialog(
    isLoading: Boolean,
    onDismiss: () -> Unit,
    onSubmit: (
        actualDistanceKm: Double,
        actualDurationMinutes: Int,
        perceivedEffort: Int,
        notes: String?
    ) -> Unit
) {
    var distanceText by remember { mutableStateOf("") }
    var durationText by remember { mutableStateOf("") }
    var effortValue by remember { mutableFloatStateOf(5f) }
    var notesText by remember { mutableStateOf("") }

    var distanceError by remember { mutableStateOf<String?>(null) }
    var durationError by remember { mutableStateOf<String?>(null) }

    AlertDialog(
        onDismissRequest = { if (!isLoading) onDismiss() },
        title = {
            Text(
                text = "Log Workout Details",
                style = MaterialTheme.typography.headlineSmall
            )
        },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "Great job completing your workout! Optionally log your details.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                // Distance
                OutlinedTextField(
                    value = distanceText,
                    onValueChange = {
                        distanceText = it
                        distanceError = null
                    },
                    label = { Text("Distance (km)") },
                    placeholder = { Text("e.g. 5.0") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    isError = distanceError != null,
                    supportingText = distanceError?.let { { Text(it) } },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                // Duration
                OutlinedTextField(
                    value = durationText,
                    onValueChange = {
                        durationText = it
                        durationError = null
                    },
                    label = { Text("Duration (minutes)") },
                    placeholder = { Text("e.g. 30") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    isError = durationError != null,
                    supportingText = durationError?.let { { Text(it) } },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                // Perceived Effort
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "Perceived Effort",
                            style = MaterialTheme.typography.bodyMedium
                        )
                        Text(
                            text = "${effortValue.toInt()}/10",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Bold,
                            color = effortColor(effortValue.toInt())
                        )
                    }
                    Slider(
                        value = effortValue,
                        onValueChange = { effortValue = it },
                        valueRange = 1f..10f,
                        steps = 8,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "Easy",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = "Maximum",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                // Notes
                OutlinedTextField(
                    value = notesText,
                    onValueChange = { notesText = it },
                    label = { Text("Notes (optional)") },
                    placeholder = { Text("How did it feel?") },
                    minLines = 2,
                    maxLines = 3,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    // Validate inputs
                    val distance = distanceText.toDoubleOrNull()
                    val duration = durationText.toIntOrNull()

                    var hasError = false

                    if (distanceText.isNotBlank() && (distance == null || distance < 0 || distance > 100)) {
                        distanceError = "Must be 0-100 km"
                        hasError = true
                    }

                    if (durationText.isNotBlank() && (duration == null || duration < 1 || duration > 600)) {
                        durationError = "Must be 1-600 min"
                        hasError = true
                    }

                    if (!hasError) {
                        onSubmit(
                            distance ?: 0.0,
                            duration ?: 0,
                            effortValue.toInt(),
                            notesText.ifBlank { null }
                        )
                    }
                },
                enabled = !isLoading
            ) {
                Text(if (isLoading) "Saving..." else "Save")
            }
        },
        dismissButton = {
            TextButton(
                onClick = onDismiss,
                enabled = !isLoading
            ) {
                Text("Skip")
            }
        }
    )
}

@Composable
private fun effortColor(effort: Int) = when {
    effort <= 3 -> MaterialTheme.colorScheme.primary
    effort <= 6 -> MaterialTheme.colorScheme.tertiary
    else -> MaterialTheme.colorScheme.error
}
