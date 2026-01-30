using HerPace.Core.DTOs;

namespace HerPace.Core.Interfaces;

public interface ICycleTrackingService
{
    Task<CyclePositionDto?> GetCurrentCyclePositionAsync(Guid runnerId);
    Task<ReportPeriodResponse> ReportPeriodStartAsync(Guid runnerId, DateTime periodStartDate);
    Task<CycleHistoryResponse> GetCycleHistoryAsync(Guid runnerId);
    bool ShouldTriggerRegeneration(DateTime predictedDate, DateTime actualDate);
}
