package com.herpace.presentation.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext

private val LightColorScheme = lightColorScheme(
    primary = HerPacePrimary,
    onPrimary = HerPaceOnPrimary,
    primaryContainer = HerPacePrimaryContainer,
    onPrimaryContainer = HerPaceOnPrimaryContainer,
    secondary = HerPaceSecondary,
    onSecondary = HerPaceOnSecondary,
    secondaryContainer = HerPaceSecondaryContainer,
    onSecondaryContainer = HerPaceOnSecondaryContainer,
    tertiary = HerPaceTertiary,
    onTertiary = HerPaceOnTertiary,
    tertiaryContainer = HerPaceTertiaryContainer,
    onTertiaryContainer = HerPaceOnTertiaryContainer,
    error = HerPaceError,
    background = HerPaceBackground,
    surface = HerPaceSurface
)

private val DarkColorScheme = darkColorScheme(
    primary = HerPacePrimaryDark,
    onPrimary = HerPaceOnPrimaryDark,
    primaryContainer = HerPacePrimaryContainerDark,
    onPrimaryContainer = HerPaceOnPrimaryContainerDark,
    secondary = HerPaceSecondaryDark,
    onSecondary = HerPaceOnSecondaryDark,
    secondaryContainer = HerPaceSecondaryContainerDark,
    onSecondaryContainer = HerPaceOnSecondaryContainerDark,
    tertiary = HerPaceTertiaryDark,
    onTertiary = HerPaceOnTertiaryDark,
    tertiaryContainer = HerPaceTertiaryContainerDark,
    onTertiaryContainer = HerPaceOnTertiaryContainerDark,
    error = HerPaceErrorDark,
    background = HerPaceBackgroundDark,
    surface = HerPaceSurfaceDark
)

@Composable
fun HerPaceTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = HerPaceTypography,
        content = content
    )
}
