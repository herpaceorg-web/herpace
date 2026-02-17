package com.herpace.data.repository

interface AuthTokenProvider {
    fun getToken(): String?
    fun saveToken(token: String)
    fun saveUserId(userId: String)
    fun getUserId(): String?
    fun getRefreshToken(): String?
    fun saveRefreshToken(token: String)
    fun clearAuth()
    fun isLoggedIn(): Boolean
}
