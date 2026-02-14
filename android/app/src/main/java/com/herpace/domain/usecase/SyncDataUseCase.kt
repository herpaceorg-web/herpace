package com.herpace.domain.usecase

import com.herpace.data.sync.SyncManager
import javax.inject.Inject

class SyncDataUseCase @Inject constructor(
    private val syncManager: SyncManager
) {
    operator fun invoke() {
        syncManager.requestImmediateSync()
    }
}
