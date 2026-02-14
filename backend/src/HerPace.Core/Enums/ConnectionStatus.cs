namespace HerPace.Core.Enums;

/// <summary>
/// Status of a connected fitness service.
/// </summary>
public enum ConnectionStatus
{
    Connected = 0,
    Disconnected = 1,
    TokenExpired = 2,
    Error = 3
}
