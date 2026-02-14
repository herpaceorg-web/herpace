package com.herpace.presentation.common

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun HerPaceButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    isLoading: Boolean = false,
    fullWidth: Boolean = true
) {
    val buttonModifier = if (fullWidth) {
        modifier.fillMaxWidth().height(52.dp)
    } else {
        modifier.height(52.dp)
    }

    Button(
        onClick = onClick,
        modifier = buttonModifier,
        enabled = enabled && !isLoading,
        shape = MaterialTheme.shapes.medium
    ) {
        if (isLoading) {
            LoadingIndicator(fullScreen = false)
        } else {
            Text(text = text, style = MaterialTheme.typography.labelLarge)
        }
    }
}

@Composable
fun HerPaceOutlinedButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    fullWidth: Boolean = true
) {
    val buttonModifier = if (fullWidth) {
        modifier.fillMaxWidth().height(52.dp)
    } else {
        modifier.height(52.dp)
    }

    OutlinedButton(
        onClick = onClick,
        modifier = buttonModifier,
        enabled = enabled,
        shape = MaterialTheme.shapes.medium
    ) {
        Text(text = text, style = MaterialTheme.typography.labelLarge)
    }
}
