package com.herpace

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.util.Log
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.biometric.BiometricPrompt
import androidx.fragment.app.FragmentActivity
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.lifecycle.lifecycleScope
import androidx.navigation.NavHostController
import androidx.navigation.compose.rememberNavController
import com.herpace.data.remote.ApiResult
import com.herpace.data.repository.AuthTokenProvider
import com.herpace.data.sync.SyncManager
import com.herpace.domain.repository.ProfileRepository
import com.herpace.util.BiometricHelper
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.remember
import androidx.navigation.compose.currentBackStackEntryAsState
import com.herpace.presentation.common.LoadingIndicator
import com.herpace.presentation.navigation.BottomNavBar
import com.herpace.presentation.navigation.NavGraph
import com.herpace.presentation.navigation.Screen
import com.herpace.presentation.navigation.bottomNavItems
import com.herpace.presentation.theme.HerPaceTheme
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : FragmentActivity() {

    @Inject
    lateinit var authTokenProvider: AuthTokenProvider

    @Inject
    lateinit var profileRepository: ProfileRepository

    @Inject
    lateinit var syncManager: SyncManager

    @Inject
    lateinit var biometricHelper: BiometricHelper

    private var startDestination by mutableStateOf<String?>(null)
    private var pendingSessionId: String? = null
    private var pendingOAuthConnected: String? = null
    private var pendingOAuthError: String? = null
    private var pendingOAuthPlatform: String? = null
    private var navController: NavHostController? = null
    private var isAuthenticated by mutableStateOf(true)
    private var biometricCheckDone = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Check for deep link from notification
        pendingSessionId = intent?.getStringExtra("sessionId")

        // Check for OAuth callback deep link (herpace://oauth/callback?...)
        extractOAuthParams(intent?.data)

        determineStartDestination()

        setContent {
            HerPaceTheme {
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    if (!isAuthenticated) {
                        Surface(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(innerPadding),
                            color = MaterialTheme.colorScheme.background
                        ) {
                            Box(
                                modifier = Modifier.fillMaxSize(),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "Locked",
                                    style = MaterialTheme.typography.headlineMedium,
                                    color = MaterialTheme.colorScheme.onBackground
                                )
                            }
                        }
                    } else {
                    val destination = startDestination
                    if (destination == null) {
                        LoadingIndicator(modifier = Modifier.padding(innerPadding))
                    } else {
                        val navControllerInstance = rememberNavController()
                        navController = navControllerInstance
                        val navBackStackEntry by navControllerInstance.currentBackStackEntryAsState()
                        val showBottomBar by remember {
                            derivedStateOf {
                                val currentRoute = navBackStackEntry?.destination?.route
                                currentRoute in bottomNavItems.map { it.route }
                            }
                        }

                        Scaffold(
                            modifier = Modifier.padding(innerPadding),
                            bottomBar = {
                                if (showBottomBar) {
                                    BottomNavBar(navController = navControllerInstance)
                                }
                            }
                        ) { innerScaffoldPadding ->
                            NavGraph(
                                navController = navControllerInstance,
                                startDestination = destination,
                                modifier = Modifier.padding(innerScaffoldPadding)
                            )
                        }

                        // Navigate to session if opened from notification
                        pendingSessionId?.let { sessionId ->
                            pendingSessionId = null
                            navControllerInstance.navigate(Screen.SessionDetail.createRoute(sessionId))
                        }

                        // Navigate to Connected Services if returning from OAuth
                        if (pendingOAuthConnected != null || pendingOAuthError != null) {
                            navigateToConnectedServicesWithOAuthResult(navControllerInstance)
                        }
                    }
                    } // end authenticated else
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)

        // Handle OAuth callback deep link
        val data = intent.data
        if (data != null && data.scheme == "herpace" && data.host == "oauth") {
            extractOAuthParams(data)
            navController?.let { navigateToConnectedServicesWithOAuthResult(it) }
            return
        }

        // Handle notification deep link
        val sessionId = intent.getStringExtra("sessionId")
        if (sessionId != null) {
            navController?.navigate(Screen.SessionDetail.createRoute(sessionId))
        }
    }

    /**
     * T210: Trigger sync when app comes to foreground.
     * onStart is called when the activity becomes visible to the user.
     */
    override fun onStart() {
        super.onStart()
        if (authTokenProvider.isLoggedIn()) {
            Log.d("MainActivity", "App foregrounded, triggering sync")
            syncManager.requestImmediateSync()

            // Biometric lock check on app resume
            if (biometricHelper.isBiometricLockEnabled() && !biometricCheckDone) {
                isAuthenticated = false
                promptBiometric()
            }
        }
    }

    override fun onStop() {
        super.onStop()
        // Reset so biometric is prompted again when returning
        if (biometricHelper.isBiometricLockEnabled()) {
            biometricCheckDone = false
        }
    }

    private fun promptBiometric() {
        biometricHelper.authenticate(
            activity = this,
            onSuccess = {
                isAuthenticated = true
                biometricCheckDone = true
            },
            onError = { errorCode, _ ->
                // Allow access if biometric hardware is unavailable
                if (errorCode == BiometricPrompt.ERROR_HW_UNAVAILABLE ||
                    errorCode == BiometricPrompt.ERROR_NO_BIOMETRICS
                ) {
                    isAuthenticated = true
                    biometricCheckDone = true
                }
            }
        )
    }

    private fun extractOAuthParams(uri: Uri?) {
        if (uri == null || uri.scheme != "herpace") return
        val path = uri.path ?: return
        if (!path.startsWith("/callback")) return

        pendingOAuthConnected = uri.getQueryParameter("connected")
        pendingOAuthError = uri.getQueryParameter("error")
        pendingOAuthPlatform = uri.getQueryParameter("platform")

        Log.d("MainActivity", "OAuth callback: connected=$pendingOAuthConnected error=$pendingOAuthError platform=$pendingOAuthPlatform")
    }

    private fun navigateToConnectedServicesWithOAuthResult(nav: NavHostController) {
        val connected = pendingOAuthConnected
        val error = pendingOAuthError
        val platform = pendingOAuthPlatform

        // Clear pending state
        pendingOAuthConnected = null
        pendingOAuthError = null
        pendingOAuthPlatform = null

        // Build route with query params for the ViewModel to consume
        val params = buildList {
            if (connected != null) add("connected=$connected")
            if (error != null) add("error=$error")
            if (platform != null) add("platform=$platform")
        }
        val query = if (params.isNotEmpty()) "?${params.joinToString("&")}" else ""

        nav.navigate("${Screen.ConnectedServices.route}$query") {
            // Don't stack multiple instances
            launchSingleTop = true
        }
    }

    private fun determineStartDestination() {
        if (!authTokenProvider.isLoggedIn()) {
            startDestination = Screen.Login.route
            return
        }

        // Schedule background sync when user is authenticated
        syncManager.scheduleSyncWork()

        lifecycleScope.launch {
            val result = profileRepository.getProfile()
            startDestination = when {
                result is ApiResult.Success && result.data != null -> Screen.Dashboard.route
                result is ApiResult.Success && result.data == null -> Screen.Onboarding.route
                else -> Screen.Dashboard.route
            }
        }
    }
}
