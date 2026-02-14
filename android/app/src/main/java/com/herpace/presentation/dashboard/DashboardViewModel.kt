package com.herpace.presentation.dashboard

import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.herpace.data.remote.ApiResult
import com.herpace.data.sync.SyncManager
import com.herpace.domain.repository.ProfileRepository
import com.herpace.domain.usecase.GetActiveTrainingPlanUseCase
import com.herpace.domain.usecase.GetSyncStatusUseCase
import android.util.Log
import com.herpace.domain.usecase.GetTodaySessionUseCase
import com.herpace.util.AnalyticsHelper
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import javax.inject.Inject

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val getTodaySessionUseCase: GetTodaySessionUseCase,
    private val getActiveTrainingPlanUseCase: GetActiveTrainingPlanUseCase,
    private val profileRepository: ProfileRepository,
    private val getSyncStatusUseCase: GetSyncStatusUseCase,
    private val syncManager: SyncManager,
    private val analyticsHelper: AnalyticsHelper,
    @ApplicationContext private val context: android.content.Context
) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    private var networkCallback: ConnectivityManager.NetworkCallback? = null

    init {
        observeNetworkConnectivity()
        loadDashboard()
    }

    fun loadDashboard() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }

            when (val result = getActiveTrainingPlanUseCase()) {
                is ApiResult.Success -> {
                    val plan = result.data
                    val todaySession = try {
                        getTodaySessionUseCase()
                    } catch (_: Exception) {
                        null
                    }
                    _uiState.update {
                        it.copy(
                            activePlan = plan,
                            todaySession = todaySession,
                            isLoading = false
                        )
                    }
                }
                is ApiResult.Error -> {
                    Log.w("DashboardViewModel", "Failed to load dashboard: ${result.message}")
                    analyticsHelper.logError("dashboard", "api_error", result.message)
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = result.message ?: "Failed to load dashboard"
                        )
                    }
                }
                is ApiResult.NetworkError -> {
                    Log.w("DashboardViewModel", "Network error loading dashboard")
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = "Network error. Please check your connection."
                        )
                    }
                }
            }

            checkPeriodReminder()
            loadSyncStatus()
        }
    }

    private suspend fun loadSyncStatus() {
        try {
            val syncStatus = getSyncStatusUseCase()
            _uiState.update {
                it.copy(
                    lastSyncTimeMillis = syncStatus.lastSyncTimeMillis,
                    pendingSyncCount = syncStatus.pendingCount,
                    syncConflictsResolved = syncStatus.conflictsResolvedCount
                )
            }
        } catch (_: Exception) {
            // Non-critical, ignore errors
        }
    }

    fun dismissSyncConflictNotification() {
        syncManager.clearConflictRecords()
        _uiState.update { it.copy(syncConflictsResolved = 0) }
    }

    /**
     * T209: Observe network connectivity and update isOffline state.
     */
    private fun observeNetworkConnectivity() {
        val connectivityManager = context.getSystemService(android.content.Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
            ?: return

        // Check initial state
        val activeNetwork = connectivityManager.activeNetwork
        val capabilities = activeNetwork?.let { connectivityManager.getNetworkCapabilities(it) }
        val isConnected = capabilities?.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) == true
        _uiState.update { it.copy(isOffline = !isConnected) }

        // Register callback for changes
        val callback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                _uiState.update { it.copy(isOffline = false) }
            }

            override fun onLost(network: Network) {
                _uiState.update { it.copy(isOffline = true) }
            }

            override fun onCapabilitiesChanged(network: Network, capabilities: NetworkCapabilities) {
                val hasInternet = capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                _uiState.update { it.copy(isOffline = !hasInternet) }
            }
        }

        val request = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()
        connectivityManager.registerNetworkCallback(request, callback)
        networkCallback = callback
    }

    override fun onCleared() {
        super.onCleared()
        networkCallback?.let { callback ->
            val connectivityManager = context.getSystemService(android.content.Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
            connectivityManager?.unregisterNetworkCallback(callback)
        }
    }

    private suspend fun checkPeriodReminder() {
        try {
            when (val result = profileRepository.getProfile()) {
                is ApiResult.Success -> {
                    val profile = result.data ?: return
                    val daysSince = ChronoUnit.DAYS.between(profile.lastPeriodStartDate, LocalDate.now()).toInt()
                    if (daysSince >= 60) {
                        _uiState.update {
                            it.copy(
                                showPeriodReminder = true,
                                daysSinceLastPeriod = daysSince
                            )
                        }
                    }
                }
                else -> { /* silently ignore - reminder is non-critical */ }
            }
        } catch (_: Exception) {
            // Non-critical check, ignore errors
        }
    }

    fun dismissPeriodReminder() {
        _uiState.update { it.copy(showPeriodReminder = false) }
    }

    fun clearError() {
        _uiState.update { it.copy(errorMessage = null) }
    }
}
