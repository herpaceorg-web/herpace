package com.herpace.presentation.plan

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowLeft
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.TextStyle
import java.util.Locale

@Composable
fun CalendarView(
    selectedDate: LocalDate,
    sessionDates: Set<LocalDate>,
    completedDates: Set<LocalDate>,
    onDateSelected: (LocalDate) -> Unit,
    modifier: Modifier = Modifier
) {
    var currentMonth by remember { mutableStateOf(YearMonth.from(selectedDate)) }

    Column(modifier = modifier.fillMaxWidth()) {
        // Month navigation header
        MonthHeader(
            yearMonth = currentMonth,
            onPreviousMonth = { currentMonth = currentMonth.minusMonths(1) },
            onNextMonth = { currentMonth = currentMonth.plusMonths(1) }
        )

        // Day of week labels
        DayOfWeekHeader()

        // Calendar grid
        CalendarGrid(
            yearMonth = currentMonth,
            selectedDate = selectedDate,
            sessionDates = sessionDates,
            completedDates = completedDates,
            onDateSelected = onDateSelected
        )
    }
}

@Composable
private fun MonthHeader(
    yearMonth: YearMonth,
    onPreviousMonth: () -> Unit,
    onNextMonth: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        IconButton(onClick = onPreviousMonth) {
            Icon(
                imageVector = Icons.AutoMirrored.Filled.KeyboardArrowLeft,
                contentDescription = "Previous month"
            )
        }

        Text(
            text = "${yearMonth.month.getDisplayName(TextStyle.FULL, Locale.getDefault())} ${yearMonth.year}",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold
        )

        IconButton(onClick = onNextMonth) {
            Icon(
                imageVector = Icons.AutoMirrored.Filled.KeyboardArrowRight,
                contentDescription = "Next month"
            )
        }
    }
}

@Composable
private fun DayOfWeekHeader() {
    val daysOfWeek = listOf(
        DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY,
        DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY, DayOfWeek.SUNDAY
    )

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceEvenly
    ) {
        daysOfWeek.forEach { day ->
            Text(
                text = day.getDisplayName(TextStyle.NARROW, Locale.getDefault()),
                modifier = Modifier.weight(1f),
                textAlign = TextAlign.Center,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
private fun CalendarGrid(
    yearMonth: YearMonth,
    selectedDate: LocalDate,
    sessionDates: Set<LocalDate>,
    completedDates: Set<LocalDate>,
    onDateSelected: (LocalDate) -> Unit
) {
    val firstDayOfMonth = yearMonth.atDay(1)
    // Monday = 1, adjust so Monday is column 0
    val startOffset = (firstDayOfMonth.dayOfWeek.value - 1)
    val daysInMonth = yearMonth.lengthOfMonth()
    val totalCells = startOffset + daysInMonth
    val rows = (totalCells + 6) / 7
    val today = LocalDate.now()

    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(2.dp)
    ) {
        for (row in 0 until rows) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                for (col in 0 until 7) {
                    val cellIndex = row * 7 + col
                    val dayNumber = cellIndex - startOffset + 1

                    if (dayNumber in 1..daysInMonth) {
                        val date = yearMonth.atDay(dayNumber)
                        val isSelected = date == selectedDate
                        val isToday = date == today
                        val hasSession = date in sessionDates
                        val isCompleted = date in completedDates

                        DayCell(
                            day = dayNumber,
                            isSelected = isSelected,
                            isToday = isToday,
                            hasSession = hasSession,
                            isCompleted = isCompleted,
                            onClick = { onDateSelected(date) },
                            modifier = Modifier.weight(1f)
                        )
                    } else {
                        // Empty cell
                        Box(modifier = Modifier.weight(1f).aspectRatio(1f))
                    }
                }
            }
        }
    }
}

@Composable
private fun DayCell(
    day: Int,
    isSelected: Boolean,
    isToday: Boolean,
    hasSession: Boolean,
    isCompleted: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    date: LocalDate? = null
) {
    val backgroundColor = when {
        isSelected -> MaterialTheme.colorScheme.primary
        isToday -> MaterialTheme.colorScheme.primaryContainer
        else -> MaterialTheme.colorScheme.surface
    }

    val textColor = when {
        isSelected -> MaterialTheme.colorScheme.onPrimary
        isToday -> MaterialTheme.colorScheme.onPrimaryContainer
        else -> MaterialTheme.colorScheme.onSurface
    }

    val borderModifier = if (isToday && !isSelected) {
        Modifier.border(1.dp, MaterialTheme.colorScheme.primary, CircleShape)
    } else {
        Modifier
    }

    val dayDescription = buildString {
        append("$day")
        if (isToday) append(", today")
        if (isSelected) append(", selected")
        if (hasSession) {
            if (isCompleted) append(", workout completed") else append(", has workout")
        }
    }

    Box(
        modifier = modifier
            .defaultMinSize(minWidth = 48.dp, minHeight = 48.dp)
            .aspectRatio(1f)
            .padding(2.dp)
            .clip(CircleShape)
            .then(borderModifier)
            .background(backgroundColor, CircleShape)
            .clickable(onClick = onClick)
            .semantics { contentDescription = dayDescription },
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = day.toString(),
                style = MaterialTheme.typography.bodySmall,
                color = textColor,
                fontWeight = if (isToday || isSelected) FontWeight.Bold else FontWeight.Normal
            )

            // Session indicator dot
            if (hasSession) {
                Box(
                    modifier = Modifier
                        .size(4.dp)
                        .clip(CircleShape)
                        .background(
                            when {
                                isCompleted && isSelected -> MaterialTheme.colorScheme.onPrimary
                                isCompleted -> MaterialTheme.colorScheme.primary
                                isSelected -> MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.7f)
                                else -> MaterialTheme.colorScheme.tertiary
                            }
                        )
                )
            }
        }
    }
}
