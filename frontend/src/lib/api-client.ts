import axios, { AxiosError } from 'axios'
import type { AxiosInstance } from 'axios'
import { auth } from './auth'
import type {
  ServicesListResponse,
  OAuthInitiateResponse,
  DisconnectResponse,
  SyncResponse,
  PaginatedActivitiesResponse,
  ImportedActivityDetailDto,
  SyncLogListResponse,
  ResearchStudySummaryDto,
  ResearchStudyDto
} from '@/types/api'

/**
 * Axios instance configured for HerPace API
 * - Automatically attaches JWT Bearer token to requests
 * - Handles 401 errors by clearing token and redirecting to login
 * - 5-minute timeout for long-running operations (plan generation)
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://localhost:7001',
  timeout: 5 * 60 * 1000, // 5 minutes (matches Blazor timeout)
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor: Attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = auth.getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor: Handle 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear it and redirect to login
      auth.clearToken()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

/**
 * Typed API methods for making requests
 */
export const api = {
  /**
   * GET request
   */
  get: <T>(url: string): Promise<T> =>
    apiClient.get<T>(url).then(res => res.data),

  /**
   * POST request
   */
  post: <TRequest, TResponse>(url: string, data: TRequest): Promise<TResponse> =>
    apiClient.post<TResponse>(url, data).then(res => res.data),

  /**
   * PUT request
   */
  put: <TRequest, TResponse>(url: string, data: TRequest): Promise<TResponse> =>
    apiClient.put<TResponse>(url, data).then(res => res.data),

  /**
   * PATCH request
   */
  patch: <TRequest, TResponse>(url: string, data: TRequest): Promise<TResponse> =>
    apiClient.patch<TResponse>(url, data).then(res => res.data),

  /**
   * DELETE request
   */
  delete: (url: string): Promise<void> =>
    apiClient.delete(url).then(() => undefined),

  /**
   * DELETE request with query params, returning typed response
   */
  deleteWithResponse: <T>(url: string): Promise<T> =>
    apiClient.delete<T>(url).then(res => res.data)
}

// Fitness Tracker API methods
export const fitnessTrackerApi = {
  getConnectedServices: (): Promise<ServicesListResponse> =>
    api.get<ServicesListResponse>('/api/fitness-tracker/services'),

  connectStrava: (): Promise<OAuthInitiateResponse> =>
    api.get<OAuthInitiateResponse>('/api/fitness-tracker/connect/strava'),

  connectGarmin: (): Promise<OAuthInitiateResponse> =>
    api.get<OAuthInitiateResponse>('/api/fitness-tracker/connect/garmin'),

  updateWomensHealthOptIn: (platform: string, optIn: boolean): Promise<{ platform: string; womensHealthDataOptIn: boolean }> =>
    api.patch<{ optIn: boolean }, { platform: string; womensHealthDataOptIn: boolean }>(
      `/api/fitness-tracker/services/${platform}/womens-health`, { optIn }
    ),

  disconnectService: (platform: string, deleteData: boolean): Promise<DisconnectResponse> =>
    api.deleteWithResponse<DisconnectResponse>(
      `/api/fitness-tracker/services/${platform}?deleteData=${deleteData}`
    ),

  triggerSync: (platform: string): Promise<SyncResponse> =>
    api.post<Record<string, never>, SyncResponse>(`/api/fitness-tracker/sync/${platform}`, {}),

  getImportedActivities: (params?: {
    platform?: string
    from?: string
    to?: string
    page?: number
    pageSize?: number
  }): Promise<PaginatedActivitiesResponse> => {
    const searchParams = new URLSearchParams()
    if (params?.platform) searchParams.set('platform', params.platform)
    if (params?.from) searchParams.set('from', params.from)
    if (params?.to) searchParams.set('to', params.to)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString())
    const query = searchParams.toString()
    return api.get<PaginatedActivitiesResponse>(
      `/api/fitness-tracker/activities${query ? `?${query}` : ''}`
    )
  },

  getActivityDetail: (id: string): Promise<ImportedActivityDetailDto> =>
    api.get<ImportedActivityDetailDto>(`/api/fitness-tracker/activities/${id}`),

  getSyncLogs: (platform?: string, limit?: number): Promise<SyncLogListResponse> => {
    const searchParams = new URLSearchParams()
    if (platform) searchParams.set('platform', platform)
    if (limit) searchParams.set('limit', limit.toString())
    const query = searchParams.toString()
    return api.get<SyncLogListResponse>(
      `/api/fitness-tracker/sync-log${query ? `?${query}` : ''}`
    )
  }
}

// Research Library API methods
export const researchApi = {
  getStudies: (params?: {
    category?: string
    tier?: string
    search?: string
    phase?: string
  }): Promise<ResearchStudySummaryDto[]> => {
    const searchParams = new URLSearchParams()
    if (params?.category) searchParams.set('category', params.category)
    if (params?.tier) searchParams.set('tier', params.tier)
    if (params?.search) searchParams.set('search', params.search)
    if (params?.phase) searchParams.set('phase', params.phase)
    const query = searchParams.toString()
    return api.get<ResearchStudySummaryDto[]>(
      `/api/research${query ? `?${query}` : ''}`
    )
  },

  getStudy: (id: number): Promise<ResearchStudyDto> =>
    api.get<ResearchStudyDto>(`/api/research/${id}`),

  getCategories: (): Promise<string[]> =>
    api.get<string[]>('/api/research/categories'),

  getStudiesForPhase: (phase: string): Promise<ResearchStudySummaryDto[]> =>
    api.get<ResearchStudySummaryDto[]>(`/api/research/for-phase/${phase}`)
}

export default apiClient
