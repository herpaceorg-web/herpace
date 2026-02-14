package com.herpace.presentation.voicecoach

import android.Manifest
import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.net.Uri
import android.provider.Settings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.core.InfiniteRepeatableSpec
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.MicOff
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilledIconButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.IconButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.herpace.domain.model.VoiceCompletionData
import com.herpace.domain.model.VoiceSessionState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VoiceCoachScreen(
    onNavigateBack: () -> Unit,
    viewModel: VoiceCoachViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    val snackbarHostState = remember { SnackbarHostState() }

    var hasPermission by remember { mutableStateOf(false) }
    var showPermissionRationale by remember { mutableStateOf(false) }

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        hasPermission = granted
        if (granted) {
            val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
            @Suppress("MissingPermission")
            viewModel.startSession(audioManager)
        } else {
            showPermissionRationale = true
        }
    }

    // Handle session completed — navigate back
    LaunchedEffect(uiState.sessionCompleted) {
        if (uiState.sessionCompleted) {
            snackbarHostState.showSnackbar("Workout logged successfully!")
            onNavigateBack()
        }
    }

    // Show errors as snackbar
    LaunchedEffect(uiState.errorMessage) {
        uiState.errorMessage?.let { msg ->
            snackbarHostState.showSnackbar(msg)
            viewModel.clearError()
        }
    }

    // Stop session when leaving
    DisposableEffect(Unit) {
        onDispose {
            viewModel.stopSession()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Voice Coach") },
                navigationIcon = {
                    IconButton(onClick = {
                        viewModel.stopSession()
                        onNavigateBack()
                    }) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back"
                        )
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            if (showPermissionRationale) {
                PermissionRationaleContent(
                    onOpenSettings = {
                        val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                            data = Uri.fromParts("package", context.packageName, null)
                        }
                        context.startActivity(intent)
                    },
                    onRetry = {
                        showPermissionRationale = false
                        permissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
                    }
                )
            } else {
                VoiceCoachContent(
                    uiState = uiState,
                    onStart = {
                        permissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
                    },
                    onStop = { viewModel.stopSession() },
                    onRetry = {
                        permissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
                    },
                    onConfirm = { viewModel.confirmCompletion() },
                    onDismissConfirmation = { viewModel.dismissConfirmation() }
                )
            }
        }
    }
}

@Composable
private fun VoiceCoachContent(
    uiState: VoiceCoachUiState,
    onStart: () -> Unit,
    onStop: () -> Unit,
    onRetry: () -> Unit,
    onConfirm: () -> Unit,
    onDismissConfirmation: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Spacer(modifier = Modifier.height(32.dp))

        // Status text
        StatusText(state = uiState.sessionState)

        Spacer(modifier = Modifier.height(16.dp))

        // Mic button with pulse animation
        MicButton(
            state = uiState.sessionState,
            onStart = onStart,
            onStop = onStop
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Instruction text
        InstructionText(state = uiState.sessionState)

        // Transcript display
        if (uiState.transcript.isNotEmpty()) {
            TranscriptCard(transcript = uiState.transcript)
        }

        // Confirmation card
        if (uiState.showConfirmation && uiState.completionData != null) {
            CompletionConfirmationCard(
                data = uiState.completionData,
                isLoading = uiState.isCompletingSession,
                onConfirm = onConfirm,
                onDismiss = onDismissConfirmation
            )
        }

        // Error retry
        if (uiState.sessionState == VoiceSessionState.ERROR) {
            Button(onClick = onRetry) {
                Text("Try Again")
            }
        }

        Spacer(modifier = Modifier.height(16.dp))
    }
}

@Composable
private fun StatusText(state: VoiceSessionState) {
    val (text, color) = when (state) {
        VoiceSessionState.IDLE -> "Ready" to MaterialTheme.colorScheme.onSurfaceVariant
        VoiceSessionState.CONNECTING -> "Connecting..." to MaterialTheme.colorScheme.primary
        VoiceSessionState.LISTENING -> "Listening..." to MaterialTheme.colorScheme.primary
        VoiceSessionState.PROCESSING -> "Processing..." to MaterialTheme.colorScheme.tertiary
        VoiceSessionState.RESPONDING -> "Coach is speaking..." to MaterialTheme.colorScheme.secondary
        VoiceSessionState.ERROR -> "Error" to MaterialTheme.colorScheme.error
    }

    Text(
        text = text,
        style = MaterialTheme.typography.titleLarge,
        color = color,
        fontWeight = FontWeight.SemiBold
    )
}

@Composable
private fun MicButton(
    state: VoiceSessionState,
    onStart: () -> Unit,
    onStop: () -> Unit
) {
    val isActive = state == VoiceSessionState.LISTENING ||
            state == VoiceSessionState.PROCESSING ||
            state == VoiceSessionState.RESPONDING

    // Pulse animation when listening
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = if (state == VoiceSessionState.LISTENING) 1.15f else 1f,
        animationSpec = InfiniteRepeatableSpec(
            animation = tween(durationMillis = 1000),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseScale"
    )

    Box(contentAlignment = Alignment.Center) {
        // Pulse ring
        if (state == VoiceSessionState.LISTENING) {
            Box(
                modifier = Modifier
                    .size(120.dp)
                    .scale(pulseScale)
                    .background(
                        color = MaterialTheme.colorScheme.primary.copy(alpha = 0.2f),
                        shape = CircleShape
                    )
            )
        }

        when {
            state == VoiceSessionState.CONNECTING -> {
                Box(
                    modifier = Modifier.size(96.dp),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(modifier = Modifier.size(96.dp))
                    Icon(
                        imageVector = Icons.Default.Mic,
                        contentDescription = null,
                        modifier = Modifier.size(40.dp),
                        tint = MaterialTheme.colorScheme.primary
                    )
                }
            }
            isActive -> {
                FilledIconButton(
                    onClick = onStop,
                    modifier = Modifier.size(96.dp),
                    colors = IconButtonDefaults.filledIconButtonColors(
                        containerColor = MaterialTheme.colorScheme.error
                    )
                ) {
                    Icon(
                        imageVector = Icons.Default.Stop,
                        contentDescription = "Stop session",
                        modifier = Modifier.size(48.dp)
                    )
                }
            }
            else -> {
                FilledIconButton(
                    onClick = onStart,
                    modifier = Modifier.size(96.dp),
                    colors = IconButtonDefaults.filledIconButtonColors(
                        containerColor = MaterialTheme.colorScheme.primary
                    )
                ) {
                    Icon(
                        imageVector = if (state == VoiceSessionState.ERROR) Icons.Default.MicOff else Icons.Default.Mic,
                        contentDescription = "Start voice coach",
                        modifier = Modifier.size(48.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun InstructionText(state: VoiceSessionState) {
    val text = when (state) {
        VoiceSessionState.IDLE -> "Tap the microphone to start talking with your AI running coach. Tell them about your workout — distance, time, and how you felt."
        VoiceSessionState.CONNECTING -> "Setting up your voice coach..."
        VoiceSessionState.LISTENING -> "Speak naturally about your workout. Your coach is listening."
        VoiceSessionState.PROCESSING -> "Your coach is thinking..."
        VoiceSessionState.RESPONDING -> "Your coach is responding. You can interrupt by speaking."
        VoiceSessionState.ERROR -> "Something went wrong. Tap \"Try Again\" to restart."
    }

    Text(
        text = text,
        style = MaterialTheme.typography.bodyMedium,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        textAlign = TextAlign.Center,
        modifier = Modifier.padding(horizontal = 24.dp)
    )
}

@Composable
private fun TranscriptCard(transcript: String) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = "Transcript",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = transcript,
                style = MaterialTheme.typography.bodyMedium
            )
        }
    }
}

@Composable
private fun CompletionConfirmationCard(
    data: VoiceCompletionData,
    isLoading: Boolean,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f)
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "Confirm Workout Details",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )

            data.actualDistance?.let { distance ->
                DetailRow(label = "Distance", value = "${String.format("%.1f", distance)} km")
            }

            data.actualDuration?.let { duration ->
                val hours = duration / 60
                val mins = duration % 60
                val text = if (hours > 0) "${hours}h ${mins}m" else "${mins}m"
                DetailRow(label = "Duration", value = text)
            }

            data.rpe?.let { rpe ->
                DetailRow(label = "Effort (RPE)", value = "$rpe/10")
            }

            data.notes?.let { notes ->
                if (notes.isNotBlank()) {
                    Text(
                        text = notes,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.End)
            ) {
                TextButton(
                    onClick = onDismiss,
                    enabled = !isLoading
                ) {
                    Text("Edit")
                }
                Button(
                    onClick = onConfirm,
                    enabled = !isLoading
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(16.dp),
                            strokeWidth = 2.dp
                        )
                    } else {
                        Text("Confirm & Save")
                    }
                }
            }
        }
    }
}

@Composable
private fun DetailRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.SemiBold
        )
    }
}

@Composable
private fun PermissionRationaleContent(
    onOpenSettings: () -> Unit,
    onRetry: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = Icons.Default.MicOff,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "Microphone Permission Required",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "The voice coach needs microphone access to hear your workout updates. Please grant permission to continue.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(24.dp))

        Button(onClick = onRetry) {
            Text("Grant Permission")
        }

        Spacer(modifier = Modifier.height(8.dp))

        OutlinedButton(onClick = onOpenSettings) {
            Text("Open App Settings")
        }
    }
}
