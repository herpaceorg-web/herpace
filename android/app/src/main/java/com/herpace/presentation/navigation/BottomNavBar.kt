package com.herpace.presentation.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.DirectionsRun
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.NavHostController
import androidx.navigation.compose.currentBackStackEntryAsState

data class BottomNavItem(
    val label: String,
    val icon: ImageVector,
    val route: String,
    val navigationRoute: String = route
)

val bottomNavItems = listOf(
    BottomNavItem("Dashboard", Icons.Default.Home, Screen.Dashboard.route),
    BottomNavItem("Races", Icons.Default.DirectionsRun, Screen.Races.route),
    BottomNavItem(
        label = "Plan",
        icon = Icons.Default.CalendarMonth,
        route = Screen.TrainingPlan.route,
        navigationRoute = Screen.TrainingPlan.createRoute()
    ),
    BottomNavItem("Profile", Icons.Default.Person, Screen.Profile.route)
)

@Composable
fun BottomNavBar(
    navController: NavHostController
) {
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    NavigationBar {
        bottomNavItems.forEach { item ->
            NavigationBarItem(
                selected = currentRoute == item.route,
                onClick = {
                    if (currentRoute != item.route) {
                        navController.navigate(item.navigationRoute) {
                            popUpTo(Screen.Dashboard.route) {
                                saveState = true
                            }
                            launchSingleTop = true
                            restoreState = true
                        }
                    }
                },
                icon = {
                    Icon(
                        imageVector = item.icon,
                        contentDescription = item.label
                    )
                },
                label = { Text(item.label) }
            )
        }
    }
}
