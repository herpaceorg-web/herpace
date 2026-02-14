package com.herpace.presentation.common

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.herpace.domain.model.RaceDistance

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun RaceDistancePicker(
    selectedDistance: RaceDistance,
    onDistanceSelected: (RaceDistance) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier) {
        Text(
            text = "Distance",
            style = MaterialTheme.typography.labelLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        FlowRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            RaceDistance.entries.forEach { distance ->
                FilterChip(
                    selected = selectedDistance == distance,
                    onClick = { onDistanceSelected(distance) },
                    label = { Text(distance.displayName) }
                )
            }
        }
    }
}
