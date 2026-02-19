package com.herpace.presentation.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.herpace.presentation.auth.LoginScreen
import com.herpace.presentation.auth.OnboardingScreen
import com.herpace.presentation.auth.SignupScreen
import com.herpace.presentation.dashboard.DashboardScreen
import com.herpace.presentation.plan.TrainingPlanScreen
import com.herpace.presentation.races.AddEditRaceScreen
import com.herpace.presentation.races.RacesListScreen
import com.herpace.presentation.profile.CycleTrackingScreen
import com.herpace.presentation.profile.NotificationSettingsScreen
import com.herpace.presentation.profile.ProfileScreen
import com.herpace.presentation.connectedservices.ConnectedServicesScreen
import com.herpace.presentation.research.ResearchLibraryScreen
import com.herpace.presentation.research.StudyDetailScreen
import com.herpace.presentation.session.SessionDetailScreen
import com.herpace.presentation.voicecoach.VoiceCoachScreen

@Composable
fun NavGraph(
    navController: NavHostController,
    startDestination: String,
    modifier: Modifier = Modifier
) {
    NavHost(
        navController = navController,
        startDestination = startDestination,
        modifier = modifier
    ) {
        // Auth
        composable(Screen.Login.route) {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(Screen.Dashboard.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                },
                onNavigateToSignup = {
                    navController.navigate(Screen.Signup.route)
                }
            )
        }
        composable(Screen.Signup.route) {
            SignupScreen(
                onSignupSuccess = {
                    navController.navigate(Screen.Onboarding.route) {
                        popUpTo(Screen.Signup.route) { inclusive = true }
                    }
                },
                onNavigateToLogin = {
                    navController.popBackStack()
                }
            )
        }

        // Onboarding
        composable(Screen.Onboarding.route) {
            OnboardingScreen(
                onOnboardingComplete = {
                    navController.navigate(Screen.Dashboard.route) {
                        popUpTo(Screen.Onboarding.route) { inclusive = true }
                    }
                }
            )
        }

        // Main
        composable(Screen.Dashboard.route) {
            DashboardScreen(
                onNavigateToRaces = {
                    navController.navigate(Screen.Races.route)
                },
                onNavigateToTrainingPlan = {
                    navController.navigate(Screen.TrainingPlan.createRoute())
                },
                onNavigateToSessionDetail = { sessionId ->
                    navController.navigate(Screen.SessionDetail.createRoute(sessionId))
                },
                onNavigateToProfile = {
                    navController.navigate(Screen.Profile.route)
                }
            )
        }

        // Races
        composable(Screen.Races.route) {
            RacesListScreen(
                onNavigateToAddRace = {
                    navController.navigate(Screen.CreateRace.route)
                },
                onNavigateToEditRace = { raceId ->
                    navController.navigate(Screen.EditRace.createRoute(raceId))
                },
                onNavigateToGeneratePlan = { raceId ->
                    navController.navigate(Screen.TrainingPlan.createRoute(raceId))
                }
            )
        }
        composable(Screen.CreateRace.route) {
            AddEditRaceScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }
        composable(
            route = Screen.EditRace.route,
            arguments = listOf(navArgument("raceId") { type = NavType.StringType })
        ) {
            AddEditRaceScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }

        // Training Plan
        composable(
            route = Screen.TrainingPlan.route,
            arguments = listOf(
                navArgument("raceId") {
                    type = NavType.StringType
                    nullable = true
                    defaultValue = null
                }
            )
        ) { backStackEntry ->
            val raceId = backStackEntry.arguments?.getString("raceId")
            TrainingPlanScreen(
                onNavigateBack = { navController.popBackStack() },
                onNavigateToSessionDetail = { sessionId ->
                    navController.navigate(Screen.SessionDetail.createRoute(sessionId))
                },
                raceId = raceId
            )
        }
        composable(
            route = Screen.PlanDetail.route,
            arguments = listOf(navArgument("planId") { type = NavType.StringType })
        ) {
            // Placeholder until further detail view
            PlaceholderScreen("Plan Detail")
        }
        composable(
            route = Screen.SessionDetail.route,
            arguments = listOf(navArgument("sessionId") { type = NavType.StringType })
        ) { backStackEntry ->
            val sessionId = backStackEntry.arguments?.getString("sessionId") ?: ""
            SessionDetailScreen(
                onNavigateBack = { navController.popBackStack() },
                onNavigateToVoiceCoach = {
                    navController.navigate(Screen.VoiceCoach.createRoute(sessionId))
                }
            )
        }
        composable(
            route = Screen.VoiceCoach.route,
            arguments = listOf(navArgument("sessionId") { type = NavType.StringType })
        ) {
            VoiceCoachScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }

        // Research Library
        composable(Screen.ResearchLibrary.route) {
            ResearchLibraryScreen(
                onNavigateBack = { navController.popBackStack() },
                onNavigateToStudy = { studyId ->
                    navController.navigate(Screen.ResearchStudyDetail.createRoute(studyId))
                }
            )
        }
        composable(
            route = Screen.ResearchStudyDetail.route,
            arguments = listOf(navArgument("studyId") { type = NavType.IntType })
        ) {
            StudyDetailScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }

        // Fitness Tracker
        composable(
            route = "${Screen.ConnectedServices.route}?connected={connected}&error={error}&platform={platform}",
            arguments = listOf(
                navArgument("connected") { type = NavType.StringType; nullable = true; defaultValue = null },
                navArgument("error") { type = NavType.StringType; nullable = true; defaultValue = null },
                navArgument("platform") { type = NavType.StringType; nullable = true; defaultValue = null }
            )
        ) { backStackEntry ->
            val oauthConnected = backStackEntry.arguments?.getString("connected")
            val oauthError = backStackEntry.arguments?.getString("error")
            val oauthPlatform = backStackEntry.arguments?.getString("platform")
            ConnectedServicesScreen(
                onNavigateBack = { navController.popBackStack() },
                oauthConnected = oauthConnected,
                oauthError = oauthError,
                oauthPlatform = oauthPlatform
            )
        }

        // Profile
        composable(Screen.Profile.route) {
            ProfileScreen(
                onNavigateBack = { navController.popBackStack() },
                onNavigateToCycleTracking = {
                    navController.navigate(Screen.CycleTracking.route)
                },
                onNavigateToConnectedServices = {
                    navController.navigate(Screen.ConnectedServices.route)
                },
                onNavigateToNotificationSettings = {
                    navController.navigate(Screen.NotificationSettings.route)
                },
                onLogout = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }
        composable(Screen.CycleTracking.route) {
            CycleTrackingScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }
        composable(Screen.Settings.route) {
            // Placeholder - navigates to notification settings for now
            PlaceholderScreen("Settings")
        }
        composable(Screen.NotificationSettings.route) {
            NotificationSettingsScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }
    }
}

@Composable
private fun PlaceholderScreen(title: String) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.headlineMedium
        )
    }
}
