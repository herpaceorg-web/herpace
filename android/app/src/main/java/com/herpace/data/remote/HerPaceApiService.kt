package com.herpace.data.remote

import com.herpace.data.remote.dto.CreateRaceRequest
import com.herpace.data.remote.dto.OAuthInitiateResponse
import com.herpace.data.remote.dto.ActivityUploadRequest
import com.herpace.data.remote.dto.ActivityUploadResponse
import com.herpace.data.remote.dto.ConnectHealthConnectRequest
import com.herpace.data.remote.dto.ConnectHealthConnectResponse
import com.herpace.data.remote.dto.DisconnectServiceResponse
import com.herpace.data.remote.dto.GeneratePlanRequest
import com.herpace.data.remote.dto.ImportedActivityDetailResponse
import com.herpace.data.remote.dto.LoginRequest
import com.herpace.data.remote.dto.LoginResponse
import com.herpace.data.remote.dto.RefreshTokenRequest
import com.herpace.data.remote.dto.RefreshTokenResponse
import com.herpace.data.remote.dto.PaginatedActivitiesResponse
import com.herpace.data.remote.dto.RaceResponse
import com.herpace.data.remote.dto.RunnerProfileRequest
import com.herpace.data.remote.dto.RunnerProfileResponse
import com.herpace.data.remote.dto.ServicesListResponse
import com.herpace.data.remote.dto.SignupRequest
import com.herpace.data.remote.dto.SignupResponse
import com.herpace.data.remote.dto.SyncTriggerResponse
import com.herpace.data.remote.dto.TrainingPlanDetailResponse
import com.herpace.data.remote.dto.TrainingPlanResponse
import com.herpace.data.remote.dto.VoiceCompletionRequest
import com.herpace.data.remote.dto.VoiceSessionTokenRequest
import com.herpace.data.remote.dto.VoiceSessionTokenResponse
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface HerPaceApiService {

    // Auth
    @POST("api/auth/signup")
    suspend fun signup(@Body request: SignupRequest): SignupResponse

    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): LoginResponse

    @POST("api/auth/refresh")
    suspend fun refreshToken(@Body request: RefreshTokenRequest): RefreshTokenResponse

    @POST("api/auth/revoke")
    suspend fun revokeToken(@Body request: RefreshTokenRequest)

    // Profile
    @GET("api/profiles/me")
    suspend fun getProfile(): RunnerProfileResponse?

    @POST("api/profiles/me")
    suspend fun saveProfile(@Body request: RunnerProfileRequest): RunnerProfileResponse

    // Races
    @GET("api/races")
    suspend fun getRaces(): List<RaceResponse>

    @POST("api/races")
    suspend fun createRace(@Body request: CreateRaceRequest): RaceResponse

    @GET("api/races/{id}")
    suspend fun getRace(@Path("id") raceId: String): RaceResponse

    // Training Plans
    @POST("api/plans")
    suspend fun generatePlan(@Body request: GeneratePlanRequest): TrainingPlanResponse

    @GET("api/plans/active")
    suspend fun getActivePlan(): TrainingPlanDetailResponse?

    // Fitness Tracker
    @GET("api/fitness-tracker/services")
    suspend fun getConnectedServices(): ServicesListResponse

    @GET("api/fitness-tracker/activities")
    suspend fun getImportedActivities(
        @Query("page") page: Int = 1,
        @Query("pageSize") pageSize: Int = 20,
        @Query("platform") platform: String? = null
    ): PaginatedActivitiesResponse

    @GET("api/fitness-tracker/activities/{id}")
    suspend fun getActivityDetail(@Path("id") activityId: String): ImportedActivityDetailResponse

    @DELETE("api/fitness-tracker/services/{platform}")
    suspend fun disconnectService(
        @Path("platform") platform: String,
        @Query("deleteData") deleteData: Boolean
    ): DisconnectServiceResponse

    @POST("api/fitness-tracker/sync/{platform}")
    suspend fun triggerSync(@Path("platform") platform: String): SyncTriggerResponse

    // OAuth connections (Strava/Garmin)
    @GET("api/fitness-tracker/connect/strava")
    suspend fun connectStrava(@Query("source") source: String = "android"): OAuthInitiateResponse

    @GET("api/fitness-tracker/connect/garmin")
    suspend fun connectGarmin(@Query("source") source: String = "android"): OAuthInitiateResponse

    // Health Connect
    @POST("api/fitness-tracker/connect/health-connect")
    suspend fun connectHealthConnect(@Body request: ConnectHealthConnectRequest): ConnectHealthConnectResponse

    @POST("api/fitness-tracker/activities/upload")
    suspend fun uploadActivities(@Body request: ActivityUploadRequest): ActivityUploadResponse

    // Voice Coach
    @POST("api/voice/token")
    suspend fun getVoiceToken(@Body request: VoiceSessionTokenRequest): VoiceSessionTokenResponse

    @POST("api/voice/sessions/{id}/complete")
    suspend fun completeSessionVoice(
        @Path("id") sessionId: String,
        @Body request: VoiceCompletionRequest
    ): Unit
}
