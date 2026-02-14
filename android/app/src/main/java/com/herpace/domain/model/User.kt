package com.herpace.domain.model

import java.time.Instant

data class User(
    val id: String,
    val email: String,
    val createdAt: Instant
)
