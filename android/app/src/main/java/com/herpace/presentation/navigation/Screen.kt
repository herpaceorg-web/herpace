package com.herpace.presentation.navigation

sealed class Screen(val route: String) {
    // Auth
    data object Login : Screen("login")
    data object Signup : Screen("signup")

    // Onboarding
    data object Onboarding : Screen("onboarding")

    // Main
    data object Dashboard : Screen("dashboard")
    data object Races : Screen("races")
    data object CreateRace : Screen("races/create")
    data object EditRace : Screen("races/{raceId}/edit") {
        fun createRoute(raceId: String) = "races/$raceId/edit"
    }

    // Training Plan
    data object TrainingPlan : Screen("training-plan?raceId={raceId}") {
        fun createRoute(raceId: String? = null): String {
            return if (raceId != null) "training-plan?raceId=$raceId" else "training-plan"
        }
    }
    data object PlanDetail : Screen("plan/{planId}") {
        fun createRoute(planId: String) = "plan/$planId"
    }
    data object SessionDetail : Screen("session/{sessionId}") {
        fun createRoute(sessionId: String) = "session/$sessionId"
    }

    // Voice Coach
    data object VoiceCoach : Screen("voice-coach/{sessionId}") {
        fun createRoute(sessionId: String) = "voice-coach/$sessionId"
    }

    // Fitness Tracker
    data object ConnectedServices : Screen("connected-services")
    data object ImportedActivities : Screen("imported-activities")
    data object ImportedActivityDetail : Screen("imported-activities/{activityId}") {
        fun createRoute(activityId: String) = "imported-activities/$activityId"
    }

    // Profile
    data object Profile : Screen("profile")
    data object CycleTracking : Screen("profile/cycle-tracking")
    data object Settings : Screen("settings")
    data object NotificationSettings : Screen("settings/notifications")
}
