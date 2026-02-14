package com.herpace.presentation.connectedservices

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.herpace.data.remote.ApiResult
import com.herpace.data.remote.HerPaceApiService
import com.herpace.data.remote.dto.ConnectHealthConnectRequest
import com.herpace.data.remote.safeApiCall
import com.herpace.data.sync.HealthConnectSyncWorker
import com.herpace.domain.model.ConnectedService
import com.herpace.domain.model.ConnectionStatus
import com.herpace.domain.model.FitnessPlatform
import com.herpace.domain.repository.HealthConnectAvailability
import com.herpace.domain.repository.HealthConnectRepository
import com.herpace.domain.usecase.SyncActivitiesUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ConnectedServicesUiState(
    val services: List<ConnectedService> = emptyList(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val successMessage: String? = null,
    val syncingPlatform: String? = null,
    val disconnectConfirmPlatform: String? = null,
    val healthConnectAvailability: HealthConnectAvailability = HealthConnectAvailability.AVAILABLE,
    val isConnectingHealthConnect: Boolean = false,
    val requestHealthConnectPermissions: Boolean = false,
    val oauthUrl: String? = null,
    val isConnectingOAuth: Boolean = false
)

@HiltViewModel
class ConnectedServicesViewModel @Inject constructor(
    @ApplicationContext private val context: Context,
    private val apiService: HerPaceApiService,
    private val healthConnectRepository: HealthConnectRepository,
    private val syncActivitiesUseCase: SyncActivitiesUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(ConnectedServicesUiState())
    val uiState: StateFlow<ConnectedServicesUiState> = _uiState.asStateFlow()

    init {
        loadServices()
        checkHealthConnectAvailability()
    }

    fun loadServices() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }

            when (val result = safeApiCall { apiService.getConnectedServices() }) {
                is ApiResult.Success -> {
                    _uiState.update {
                        it.copy(
                            services = result.data.services.map { s -> s.toDomain() },
                            isLoading = false
                        )
                    }
                }
                is ApiResult.Error -> {
                    _uiState.update {
                        it.copy(
                            services = it.services.ifEmpty { defaultServices() },
                            isLoading = false,
                            errorMessage = result.message ?: "Failed to load services"
                        )
                    }
                }
                is ApiResult.NetworkError -> {
                    _uiState.update {
                        it.copy(
                            services = it.services.ifEmpty { defaultServices() },
                            isLoading = false,
                            errorMessage = "Network error. Please check your connection."
                        )
                    }
                }
            }
        }
    }

    private fun defaultServices(): List<ConnectedService> = listOf(
        ConnectedService(
            platform = FitnessPlatform.STRAVA,
            displayName = "Strava",
            status = ConnectionStatus.NOT_CONNECTED,
            externalUserId = null,
            connectedAt = null,
            lastSyncAt = null,
            activitiesImported = 0,
            available = true
        ),
        ConnectedService(
            platform = FitnessPlatform.GARMIN,
            displayName = "Garmin Connect",
            status = ConnectionStatus.NOT_CONNECTED,
            externalUserId = null,
            connectedAt = null,
            lastSyncAt = null,
            activitiesImported = 0,
            available = true
        ),
        ConnectedService(
            platform = FitnessPlatform.HEALTH_CONNECT,
            displayName = "Health Connect",
            status = ConnectionStatus.NOT_CONNECTED,
            externalUserId = null,
            connectedAt = null,
            lastSyncAt = null,
            activitiesImported = 0,
            available = true
        )
    )

    private fun checkHealthConnectAvailability() {
        viewModelScope.launch {
            val availability = healthConnectRepository.checkAvailability()
            _uiState.update { it.copy(healthConnectAvailability = availability) }
        }
    }

    fun connectHealthConnect() {
        viewModelScope.launch {
            val availability = healthConnectRepository.checkAvailability()
            _uiState.update { it.copy(healthConnectAvailability = availability) }

            when (availability) {
                HealthConnectAvailability.AVAILABLE -> {
                    // Request permissions via the UI's ActivityResultLauncher
                    _uiState.update { it.copy(requestHealthConnectPermissions = true) }
                }
                HealthConnectAvailability.NOT_INSTALLED -> {
                    _uiState.update {
                        it.copy(errorMessage = "Health Connect is not installed. Please install it from the Play Store.")
                    }
                }
                HealthConnectAvailability.NOT_SUPPORTED -> {
                    _uiState.update {
                        it.copy(errorMessage = "Health Connect is not supported on this device.")
                    }
                }
            }
        }
    }

    fun onHealthConnectPermissionsResult(granted: Set<String>) {
        _uiState.update { it.copy(requestHealthConnectPermissions = false) }

        if (granted.isEmpty()) {
            _uiState.update {
                it.copy(errorMessage = "Health Connect permissions are required to sync your runs.")
            }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isConnectingHealthConnect = true) }

            // Register with the backend
            val request = ConnectHealthConnectRequest(
                grantedPermissions = granted.toList()
            )

            when (safeApiCall { apiService.connectHealthConnect(request) }) {
                is ApiResult.Success -> {
                    // Schedule periodic sync
                    HealthConnectSyncWorker.schedule(context)

                    // Trigger initial sync
                    _uiState.update {
                        it.copy(
                            isConnectingHealthConnect = false,
                            syncingPlatform = FitnessPlatform.HEALTH_CONNECT.toApiValue()
                        )
                    }

                    val syncResult = syncActivitiesUseCase()
                    _uiState.update { it.copy(syncingPlatform = null) }

                    if (syncResult.error != null) {
                        _uiState.update {
                            it.copy(errorMessage = "Connected, but initial sync failed: ${syncResult.error}")
                        }
                    }

                    loadServices()
                }
                is ApiResult.Error -> {
                    _uiState.update {
                        it.copy(
                            isConnectingHealthConnect = false,
                            errorMessage = "Failed to register Health Connect. Please try again."
                        )
                    }
                }
                is ApiResult.NetworkError -> {
                    _uiState.update {
                        it.copy(
                            isConnectingHealthConnect = false,
                            errorMessage = "Network error. Please check your connection."
                        )
                    }
                }
            }
        }
    }

    fun getHealthConnectPermissions(): Set<String> {
        return healthConnectRepository.getRequiredPermissions()
    }

    fun connectStrava() {
        viewModelScope.launch {
            _uiState.update { it.copy(isConnectingOAuth = true, errorMessage = null) }

            when (val result = safeApiCall { apiService.connectStrava() }) {
                is ApiResult.Success -> {
                    _uiState.update {
                        it.copy(isConnectingOAuth = false, oauthUrl = result.data.authorizationUrl)
                    }
                }
                is ApiResult.Error -> {
                    _uiState.update {
                        it.copy(
                            isConnectingOAuth = false,
                            errorMessage = result.message ?: "Failed to initiate Strava connection"
                        )
                    }
                }
                is ApiResult.NetworkError -> {
                    _uiState.update {
                        it.copy(
                            isConnectingOAuth = false,
                            errorMessage = "Network error. Please check your connection."
                        )
                    }
                }
            }
        }
    }

    fun connectGarmin() {
        viewModelScope.launch {
            _uiState.update { it.copy(isConnectingOAuth = true, errorMessage = null) }

            when (val result = safeApiCall { apiService.connectGarmin() }) {
                is ApiResult.Success -> {
                    _uiState.update {
                        it.copy(isConnectingOAuth = false, oauthUrl = result.data.authorizationUrl)
                    }
                }
                is ApiResult.Error -> {
                    _uiState.update {
                        it.copy(
                            isConnectingOAuth = false,
                            errorMessage = result.message ?: "Failed to initiate Garmin connection"
                        )
                    }
                }
                is ApiResult.NetworkError -> {
                    _uiState.update {
                        it.copy(
                            isConnectingOAuth = false,
                            errorMessage = "Network error. Please check your connection."
                        )
                    }
                }
            }
        }
    }

    fun onOAuthUrlHandled() {
        _uiState.update { it.copy(oauthUrl = null) }
    }

    fun handleOAuthResult(connected: String?, error: String?, platform: String?) {
        if (connected != null) {
            _uiState.update {
                it.copy(successMessage = "${connected.replaceFirstChar { c -> c.uppercase() }} connected successfully!")
            }
            loadServices()
        } else if (error != null) {
            val message = when (error) {
                "denied" -> "${platform?.replaceFirstChar { c -> c.uppercase() } ?: "Service"} authorization was denied."
                else -> "Failed to connect ${platform?.replaceFirstChar { c -> c.uppercase() } ?: "service"}. Please try again."
            }
            _uiState.update { it.copy(errorMessage = message) }
        }
    }

    fun clearSuccess() {
        _uiState.update { it.copy(successMessage = null) }
    }

    fun showDisconnectConfirmation(platform: String) {
        _uiState.update { it.copy(disconnectConfirmPlatform = platform) }
    }

    fun dismissDisconnectConfirmation() {
        _uiState.update { it.copy(disconnectConfirmPlatform = null) }
    }

    fun disconnect(platform: String, deleteData: Boolean) {
        viewModelScope.launch {
            _uiState.update { it.copy(disconnectConfirmPlatform = null) }

            when (safeApiCall { apiService.disconnectService(platform, deleteData) }) {
                is ApiResult.Success -> {
                    // Cancel Health Connect sync worker if disconnecting HC
                    if (platform == FitnessPlatform.HEALTH_CONNECT.toApiValue()) {
                        HealthConnectSyncWorker.cancel(context)
                    }
                    loadServices()
                }
                is ApiResult.Error, is ApiResult.NetworkError -> {
                    _uiState.update {
                        it.copy(errorMessage = "Failed to disconnect. Please try again.")
                    }
                }
            }
        }
    }

    fun triggerSync(platform: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(syncingPlatform = platform) }

            if (platform == FitnessPlatform.HEALTH_CONNECT.toApiValue()) {
                // Health Connect sync happens locally
                val result = syncActivitiesUseCase()
                _uiState.update { it.copy(syncingPlatform = null) }
                if (result.error != null) {
                    _uiState.update {
                        it.copy(errorMessage = "Sync failed: ${result.error}")
                    }
                }
                loadServices()
            } else {
                when (safeApiCall { apiService.triggerSync(platform) }) {
                    is ApiResult.Success -> {
                        _uiState.update { it.copy(syncingPlatform = null) }
                        loadServices()
                    }
                    is ApiResult.Error, is ApiResult.NetworkError -> {
                        _uiState.update {
                            it.copy(
                                syncingPlatform = null,
                                errorMessage = "Sync failed. Please try again later."
                            )
                        }
                    }
                }
            }
        }
    }

    fun clearError() {
        _uiState.update { it.copy(errorMessage = null) }
    }
}
