package com.herpace.presentation.common

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.herpace.domain.model.CyclePhase
import com.herpace.presentation.theme.CycleFollicular
import com.herpace.presentation.theme.CycleFollicularDark
import com.herpace.presentation.theme.CycleLuteal
import com.herpace.presentation.theme.CycleLutealDark
import com.herpace.presentation.theme.CycleMenstrual
import com.herpace.presentation.theme.CycleMenstrualDark
import com.herpace.presentation.theme.CycleOvulatory
import com.herpace.presentation.theme.CycleOvulatoryDark

@Composable
fun CyclePhaseIndicator(
    cyclePhase: CyclePhase,
    modifier: Modifier = Modifier,
    showLabel: Boolean = true
) {
    val color = cyclePhase.toColor()

    Row(
        modifier = modifier.semantics {
            contentDescription = "${cyclePhase.displayName} phase"
        },
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Box(
            modifier = Modifier
                .size(10.dp)
                .clip(CircleShape)
                .background(color)
        )
        if (showLabel) {
            Text(
                text = cyclePhase.displayName,
                style = MaterialTheme.typography.labelSmall,
                color = color
            )
        }
    }
}

@Composable
fun CyclePhase.toColor(): Color {
    val isDark = isSystemInDarkTheme()
    return when (this) {
        CyclePhase.MENSTRUAL -> if (isDark) CycleMenstrualDark else CycleMenstrual
        CyclePhase.FOLLICULAR -> if (isDark) CycleFollicularDark else CycleFollicular
        CyclePhase.OVULATORY -> if (isDark) CycleOvulatoryDark else CycleOvulatory
        CyclePhase.LUTEAL -> if (isDark) CycleLutealDark else CycleLuteal
    }
}
