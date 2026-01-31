namespace HerPace.Client.Services;

/// <summary>
/// Service for managing and caching user preferences, including distance unit preference.
/// </summary>
public class UserPreferencesService
{
    private readonly ApiClient _apiClient;
    private UserProfile? _cachedProfile;
    private bool _isLoading;

    public event Action? OnPreferencesChanged;

    public UserPreferencesService(ApiClient apiClient)
    {
        _apiClient = apiClient;
    }

    /// <summary>
    /// Gets the user's distance unit preference, fetching from API if not cached.
    /// </summary>
    public async Task<DistanceUnit> GetDistanceUnitAsync()
    {
        var profile = await GetUserProfileAsync();
        return profile?.DistanceUnit ?? DistanceUnit.Kilometers;
    }

    /// <summary>
    /// Gets the user's complete profile, caching the result.
    /// </summary>
    public async Task<UserProfile?> GetUserProfileAsync()
    {
        if (_cachedProfile != null)
        {
            return _cachedProfile;
        }

        if (_isLoading)
        {
            // Wait for current load to complete
            int attempts = 0;
            while (_isLoading && attempts < 50)
            {
                await Task.Delay(100);
                attempts++;
            }
            return _cachedProfile;
        }

        try
        {
            _isLoading = true;
            _cachedProfile = await _apiClient.GetAsync<UserProfile>("/api/profiles/me");
            return _cachedProfile;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error loading user profile: {ex.Message}");
            return null;
        }
        finally
        {
            _isLoading = false;
        }
    }

    /// <summary>
    /// Clears the cached profile, forcing a fresh fetch on next call.
    /// </summary>
    public void ClearCache()
    {
        _cachedProfile = null;
        OnPreferencesChanged?.Invoke();
    }

    public class UserProfile
    {
        public Guid Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public int Age { get; set; }
        public decimal Height { get; set; }
        public decimal Weight { get; set; }
        public int Experience { get; set; }
        public int DistanceGoal { get; set; }
        public DistanceUnit DistanceUnit { get; set; } = DistanceUnit.Kilometers;
        public decimal? TypicalWeeklyMileage { get; set; }
        public bool TrackCycle { get; set; }
        public int CycleLength { get; set; }
    }
}
