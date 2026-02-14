package com.herpace.domain.usecase

import com.herpace.data.local.dao.TrainingSessionDao
import com.herpace.data.local.dao.TrainingPlanDao
import com.herpace.data.repository.AuthTokenProvider
import com.herpace.domain.model.CyclePhase
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import javax.inject.Inject

class RecalculateCyclePhasesUseCase @Inject constructor(
    private val trainingPlanDao: TrainingPlanDao,
    private val trainingSessionDao: TrainingSessionDao,
    private val authTokenProvider: AuthTokenProvider
) {
    suspend operator fun invoke(cycleLength: Int, lastPeriodStartDate: LocalDate) {
        val userId = authTokenProvider.getUserId() ?: return
        val activePlan = trainingPlanDao.getActivePlan(userId) ?: return
        val sessions = trainingSessionDao.getByPlanId(activePlan.id)

        for (session in sessions) {
            val sessionDate = session.date
            val newPhase = calculateCyclePhase(sessionDate, cycleLength, lastPeriodStartDate)
            trainingSessionDao.updateCyclePhase(session.id, newPhase.name)
        }
    }

    private fun calculateCyclePhase(
        date: LocalDate,
        cycleLength: Int,
        lastPeriodStartDate: LocalDate
    ): CyclePhase {
        val daysSinceLastPeriod = ChronoUnit.DAYS.between(lastPeriodStartDate, date).toInt()
        val dayInCycle = ((daysSinceLastPeriod % cycleLength) + cycleLength) % cycleLength

        // Scale phases proportionally to cycle length (based on standard 28-day cycle)
        val menstrualEnd = (cycleLength * 5.0 / 28).toInt()
        val follicularEnd = (cycleLength * 13.0 / 28).toInt()
        val ovulatoryEnd = (cycleLength * 17.0 / 28).toInt()

        return when {
            dayInCycle < menstrualEnd -> CyclePhase.MENSTRUAL
            dayInCycle < follicularEnd -> CyclePhase.FOLLICULAR
            dayInCycle < ovulatoryEnd -> CyclePhase.OVULATORY
            else -> CyclePhase.LUTEAL
        }
    }
}
