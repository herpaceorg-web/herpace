package com.herpace.presentation.common

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.herpace.domain.model.FitnessLevel

@Composable
fun FitnessLevelPicker(
    selected: FitnessLevel,
    onSelect: (FitnessLevel) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier) {
        Text(
            text = "Fitness Level",
            style = MaterialTheme.typography.titleMedium,
            modifier = Modifier.padding(bottom = 8.dp)
        )
        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            FitnessLevel.entries.forEach { level ->
                FilterChip(
                    selected = selected == level,
                    onClick = { onSelect(level) },
                    label = { Text(level.displayName) }
                )
            }
        }
    }
}
