package com.herpace.presentation.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.herpace.data.repository.AuthTokenProvider
import com.herpace.domain.model.NotificationSchedule
import com.herpace.domain.usecase.GetNotificationScheduleUseCase
import android.util.Log
import com.herpace.domain.usecase.UpdateNotificationScheduleUseCase
import com.herpace.util.AnalyticsHelper
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.LocalTime
import java.util.UUID
import javax.inject.Inject

data class NotificationSettingsUiState(
    val enabled: Boolean = true,
    val morningReminderEnabled: Boolean = true,
    val morningReminderHour: Int = 7,
    val morningReminderMinute: Int = 0,
    val eveningReminderEnabled: Boolean = true,
    val eveningReminderHour: Int = 18,
    val eveningReminderMinute: Int = 0,
    val isLoading: Boolean = false,
    val isSaving: Boolean = false,
    val errorMessage: String? = null,
    val saveSuccess: Boolean = false
)

@HiltViewModel
class NotificationSettingsViewModel @Inject constructor(
    private val getNotificationScheduleUseCase: GetNotificationScheduleUseCase,
    private val updateNotificationScheduleUseCase: UpdateNotificationScheduleUseCase,
    private val authTokenProvider: AuthTokenProvider,
    private val analyticsHelper: AnalyticsHelper
) : ViewModel() {

    private val _uiState = MutableStateFlow(NotificationSettingsUiState())
    val uiState: StateFlow<NotificationSettingsUiState> = _uiState.asStateFlow()

    private var scheduleId: String? = null

    init {
        loadSchedule()
    }

    private fun loadSchedule() {
        val userId = authTokenProvider.getUserId() ?: return
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            val schedule = getNotificationScheduleUseCase(userId)
            if (schedule != null) {
                scheduleId = schedule.id
                _uiState.update {
                    it.copy(
                        enabled = schedule.enabled,
                        morningReminderEnabled = schedule.morningReminderEnabled,
                        morningReminderHour = schedule.morningReminderTime?.hour ?: 7,
                        morningReminderMinute = schedule.morningReminderTime?.minute ?: 0,
                        eveningReminderEnabled = schedule.eveningReminderEnabled,
                        eveningReminderHour = schedule.eveningReminderTime?.hour ?: 18,
                        eveningReminderMinute = schedule.eveningReminderTime?.minute ?: 0,
                        isLoading = false
                    )
                }
            } else {
                _uiState.update { it.copy(isLoading = false) }
            }
        }
    }

    fun onEnabledChange(enabled: Boolean) {
        _uiState.update { it.copy(enabled = enabled) }
    }

    fun onMorningReminderEnabledChange(enabled: Boolean) {
        _uiState.update { it.copy(morningReminderEnabled = enabled) }
    }

    fun onMorningTimeChange(hour: Int, minute: Int) {
        _uiState.update { it.copy(morningReminderHour = hour, morningReminderMinute = minute) }
    }

    fun onEveningReminderEnabledChange(enabled: Boolean) {
        _uiState.update { it.copy(eveningReminderEnabled = enabled) }
    }

    fun onEveningTimeChange(hour: Int, minute: Int) {
        _uiState.update { it.copy(eveningReminderHour = hour, eveningReminderMinute = minute) }
    }

    fun saveSettings() {
        val userId = authTokenProvider.getUserId() ?: return
        val state = _uiState.value

        viewModelScope.launch {
            _uiState.update { it.copy(isSaving = true, errorMessage = null) }
            try {
                val schedule = NotificationSchedule(
                    id = scheduleId ?: UUID.randomUUID().toString(),
                    userId = userId,
                    enabled = state.enabled,
                    morningReminderEnabled = state.morningReminderEnabled,
                    morningReminderTime = LocalTime.of(state.morningReminderHour, state.morningReminderMinute),
                    eveningReminderEnabled = state.eveningReminderEnabled,
                    eveningReminderTime = LocalTime.of(state.eveningReminderHour, state.eveningReminderMinute)
                )
                updateNotificationScheduleUseCase(schedule)
                scheduleId = schedule.id
                _uiState.update { it.copy(isSaving = false, saveSuccess = true) }
            } catch (e: Exception) {
                Log.e("NotificationSettingsVM", "Failed to save settings", e)
                analyticsHelper.logError("notification_settings", "exception", e.message)
                _uiState.update {
                    it.copy(isSaving = false, errorMessage = "Failed to save settings: ${e.message}")
                }
            }
        }
    }

    fun clearSaveSuccess() {
        _uiState.update { it.copy(saveSuccess = false) }
    }

    fun clearError() {
        _uiState.update { it.copy(errorMessage = null) }
    }
}
