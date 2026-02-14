package com.herpace.data.voice

import android.Manifest
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.util.Base64
import android.util.Log
import androidx.annotation.RequiresPermission

/**
 * Captures audio from the device microphone at 16kHz mono PCM_16BIT.
 * Reads ~100ms chunks (3200 bytes) on a background thread and delivers
 * base64-encoded data via callback.
 */
class AudioCaptureManager {

    companion object {
        private const val TAG = "AudioCaptureManager"
        private const val SAMPLE_RATE = 16000
        private const val CHANNEL_CONFIG = AudioFormat.CHANNEL_IN_MONO
        private const val AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT
        // ~100ms of audio at 16kHz mono 16-bit = 16000 * 0.1 * 2 = 3200 bytes
        private const val CHUNK_SIZE_BYTES = 3200
    }

    private var audioRecord: AudioRecord? = null
    private var captureThread: Thread? = null
    @Volatile
    private var isCapturing = false

    /**
     * Starts audio capture. Must be called after RECORD_AUDIO permission is granted.
     * @param onAudioChunk Called on background thread with base64-encoded PCM chunks.
     * @return true if capture started successfully, false otherwise.
     */
    @RequiresPermission(Manifest.permission.RECORD_AUDIO)
    fun start(onAudioChunk: (String) -> Unit): Boolean {
        if (isCapturing) {
            Log.w(TAG, "Already capturing")
            return true
        }

        val minBufferSize = AudioRecord.getMinBufferSize(SAMPLE_RATE, CHANNEL_CONFIG, AUDIO_FORMAT)
        if (minBufferSize == AudioRecord.ERROR || minBufferSize == AudioRecord.ERROR_BAD_VALUE) {
            Log.e(TAG, "Invalid AudioRecord buffer size: $minBufferSize")
            return false
        }

        val bufferSize = maxOf(minBufferSize, CHUNK_SIZE_BYTES * 2)

        try {
            audioRecord = AudioRecord(
                MediaRecorder.AudioSource.VOICE_COMMUNICATION,
                SAMPLE_RATE,
                CHANNEL_CONFIG,
                AUDIO_FORMAT,
                bufferSize
            )

            if (audioRecord?.state != AudioRecord.STATE_INITIALIZED) {
                Log.e(TAG, "AudioRecord failed to initialize")
                audioRecord?.release()
                audioRecord = null
                return false
            }

            audioRecord?.startRecording()
            isCapturing = true

            captureThread = Thread({
                android.os.Process.setThreadPriority(android.os.Process.THREAD_PRIORITY_URGENT_AUDIO)
                val buffer = ByteArray(CHUNK_SIZE_BYTES)

                while (isCapturing) {
                    val bytesRead = audioRecord?.read(buffer, 0, CHUNK_SIZE_BYTES) ?: -1
                    if (bytesRead > 0) {
                        val data = if (bytesRead == CHUNK_SIZE_BYTES) {
                            buffer
                        } else {
                            buffer.copyOf(bytesRead)
                        }
                        val base64 = Base64.encodeToString(data, Base64.NO_WRAP)
                        onAudioChunk(base64)
                    } else if (bytesRead < 0) {
                        Log.e(TAG, "AudioRecord.read error: $bytesRead")
                        break
                    }
                }
            }, "AudioCapture").apply {
                isDaemon = true
                start()
            }

            Log.d(TAG, "Audio capture started (${SAMPLE_RATE}Hz, mono, PCM_16BIT)")
            return true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start audio capture", e)
            stop()
            return false
        }
    }

    fun stop() {
        isCapturing = false
        captureThread?.join(1000)
        captureThread = null

        try {
            audioRecord?.stop()
        } catch (e: IllegalStateException) {
            Log.w(TAG, "AudioRecord.stop() failed", e)
        }
        audioRecord?.release()
        audioRecord = null
        Log.d(TAG, "Audio capture stopped")
    }

    val isActive: Boolean get() = isCapturing
}
