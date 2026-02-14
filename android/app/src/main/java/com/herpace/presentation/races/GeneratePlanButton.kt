package com.herpace.presentation.races

import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.herpace.presentation.common.HerPaceButton

@Composable
fun GeneratePlanButton(
    raceName: String,
    onConfirm: () -> Unit,
    isLoading: Boolean = false
) {
    var showDialog by remember { mutableStateOf(false) }

    HerPaceButton(
        text = "Generate Plan",
        onClick = { showDialog = true },
        isLoading = isLoading,
        enabled = !isLoading
    )

    if (showDialog) {
        AlertDialog(
            onDismissRequest = { showDialog = false },
            title = {
                Text(text = "Generate Training Plan")
            },
            text = {
                Text(
                    text = "Generate an AI-powered training plan for \"$raceName\"? " +
                        "This may take up to 30 seconds. Any existing active plan will be replaced."
                )
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        showDialog = false
                        onConfirm()
                    }
                ) {
                    Text("Generate", color = MaterialTheme.colorScheme.primary)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}
