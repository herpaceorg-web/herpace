package com.herpace.data.remote

sealed class ApiResult<out T> {
    data class Success<T>(val data: T) : ApiResult<T>()
    data class Error(val code: Int, val message: String?) : ApiResult<Nothing>()
    data object NetworkError : ApiResult<Nothing>()
}
