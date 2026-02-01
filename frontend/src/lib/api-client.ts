import axios, { AxiosInstance, AxiosError } from 'axios'
import { auth } from './auth'

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
    apiClient.delete(url).then(() => undefined)
}

export default apiClient
