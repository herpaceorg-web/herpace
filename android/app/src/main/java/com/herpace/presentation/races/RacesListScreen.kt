package com.herpace.presentation.races

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.pulltorefresh.PullToRefreshContainer
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.herpace.domain.model.Race
import com.herpace.presentation.common.ErrorMessage
import com.herpace.presentation.common.LoadingIndicator

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RacesListScreen(
    onNavigateToAddRace: () -> Unit,
    onNavigateToEditRace: (String) -> Unit,
    onNavigateToGeneratePlan: (String) -> Unit = {},
    viewModel: RacesViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var raceToDelete by remember { mutableStateOf<Race?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("My Races") }
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = onNavigateToAddRace,
                containerColor = MaterialTheme.colorScheme.primary
            ) {
                Icon(
                    imageVector = Icons.Default.Add,
                    contentDescription = "Add race"
                )
            }
        }
    ) { paddingValues ->
        val pullToRefreshState = rememberPullToRefreshState()

        if (pullToRefreshState.isRefreshing) {
            LaunchedEffect(true) {
                viewModel.refreshRaces()
            }
        }

        LaunchedEffect(uiState.isLoading) {
            if (!uiState.isLoading) {
                pullToRefreshState.endRefresh()
            }
        }

        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .nestedScroll(pullToRefreshState.nestedScrollConnection)
        ) {
            if (uiState.races.isEmpty() && !uiState.isLoading) {
                EmptyRacesContent(
                    modifier = Modifier.fillMaxSize()
                )
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.fillMaxSize()
                ) {
                    items(uiState.races, key = { it.id }) { race ->
                        RaceCard(
                            race = race,
                            onEditClick = { onNavigateToEditRace(race.id) },
                            onDeleteClick = { raceToDelete = race },
                            onGeneratePlanClick = { onNavigateToGeneratePlan(race.id) }
                        )
                    }
                }
            }

            if (uiState.errorMessage != null) {
                ErrorMessage(
                    message = uiState.errorMessage!!,
                    onRetry = viewModel::refreshRaces,
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(16.dp)
                )
            }

            PullToRefreshContainer(
                state = pullToRefreshState,
                modifier = Modifier.align(Alignment.TopCenter)
            )
        }
    }

    raceToDelete?.let { race ->
        DeleteRaceDialog(
            raceName = race.name,
            onConfirm = {
                viewModel.deleteRace(race.id)
                raceToDelete = null
            },
            onDismiss = { raceToDelete = null }
        )
    }
}

@Composable
private fun EmptyRacesContent(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier,
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "No races yet",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Tap + to add your first race goal",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
