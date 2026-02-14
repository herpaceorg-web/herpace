package com.herpace.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class SignupRequest(
    val email: String,
    val password: String,
    val confirmPassword: String
)

@Serializable
data class SignupResponse(
    val token: String,
    val userId: String,
    val email: String
)

@Serializable
data class LoginRequest(
    val email: String,
    val password: String
)

@Serializable
data class LoginResponse(
    val token: String,
    val userId: String,
    val email: String
)
