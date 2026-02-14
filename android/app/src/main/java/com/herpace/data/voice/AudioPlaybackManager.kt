package com.herpace.data.voice

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioTrack
import android.util.Base64
import android.util.Log
import java.util.concurrent.ConcurrentLinkedQueue
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Plays back PCM audio received from Gemini at 24kHz mono PCM_16BIT.
 * Decodes base64 data chunks and writes to an AudioTrack in streaming mode.
 */
class AudioPlaybackManager {

    companion object {
        private const val TAG = "AudioPlaybackManager"
        private const val SAMPLE_RATE = 24000
        private const val CHANNEL_CONFIG = AudioFormat.CHANNEL_OUT_MONO
        private const val AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT
    }

    private var audioTrack: AudioTrack? = null
    private val audioQueue = ConcurrentLinkedQueue<ByteArray>()
    private var playbackThread: Thread? = null
    private val isPlaying = AtomicBoolean(false)
    private var audioManager: AudioManager? = null
    private var audioFocusGranted = false

    fun initialize(audioManager: AudioManager): Boolean {
        this.audioManager = audioManager

        val minBufferSize = AudioTrack.getMinBufferSize(SAMPLE_RATE, CHANNEL_CONFIG, AUDIO_FORMAT)
        if (minBufferSize == AudioTrack.ERROR || minBufferSize == AudioTrack.ERROR_BAD_VALUE) {
            Log.e(TAG, "Invalid AudioTrack buffer size: $minBufferSize")
            return false
        }

        try {
            audioTrack = AudioTrack.Builder()
                .setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ASSISTANT)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                        .build()
                )
                .setAudioFormat(
                    AudioFormat.Builder()
                        .setSampleRate(SAMPLE_RATE)
                        .setChannelMask(CHANNEL_CONFIG)
                        .setEncoding(AUDIO_FORMAT)
                        .build()
                )
                .setBufferSizeInBytes(minBufferSize * 2)
                .setTransferMode(AudioTrack.MODE_STREAM)
                .build()

            if (audioTrack?.state != AudioTrack.STATE_INITIALIZED) {
                Log.e(TAG, "AudioTrack failed to initialize")
                audioTrack?.release()
                audioTrack = null
                return false
            }

            Log.d(TAG, "AudioTrack initialized (${SAMPLE_RATE}Hz, mono, PCM_16BIT)")
            return true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to create AudioTrack", e)
            return false
        }
    }

    fun requestAudioFocus(): Boolean {
        val am = audioManager ?: return false
        val result = am.requestAudioFocus(
            { focusChange ->
                when (focusChange) {
                    AudioManager.AUDIOFOCUS_LOSS,
                    AudioManager.AUDIOFOCUS_LOSS_TRANSIENT -> {
                        clear()
                    }
                    AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK -> {
                        audioTrack?.setVolume(0.3f)
                    }
                    AudioManager.AUDIOFOCUS_GAIN -> {
                        audioTrack?.setVolume(1.0f)
                    }
                }
            },
            AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ASSISTANT)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                .build(),
            AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE,
            0
        )
        audioFocusGranted = result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED
        return audioFocusGranted
    }

    /**
     * Enqueue a base64-encoded PCM audio chunk for playback.
     */
    fun enqueue(base64Audio: String) {
        try {
            val pcmBytes = Base64.decode(base64Audio, Base64.DEFAULT)
            audioQueue.add(pcmBytes)
            ensurePlaybackStarted()
        } catch (e: Exception) {
            Log.e(TAG, "Failed to decode audio chunk", e)
        }
    }

    private fun ensurePlaybackStarted() {
        if (isPlaying.compareAndSet(false, true)) {
            try {
                audioTrack?.play()
            } catch (e: IllegalStateException) {
                Log.e(TAG, "AudioTrack.play() failed", e)
                isPlaying.set(false)
                return
            }

            playbackThread = Thread({
                android.os.Process.setThreadPriority(android.os.Process.THREAD_PRIORITY_URGENT_AUDIO)

                while (isPlaying.get()) {
                    val chunk = audioQueue.poll()
                    if (chunk != null) {
                        audioTrack?.write(chunk, 0, chunk.size)
                    } else {
                        // No data available — pause briefly then check again
                        Thread.sleep(10)
                    }
                }
            }, "AudioPlayback").apply {
                isDaemon = true
                start()
            }
        }
    }

    /**
     * Clear the audio queue (e.g. on interruption).
     */
    fun clear() {
        audioQueue.clear()
        try {
            audioTrack?.pause()
            audioTrack?.flush()
        } catch (e: IllegalStateException) {
            Log.w(TAG, "AudioTrack pause/flush failed", e)
        }
        isPlaying.set(false)
        playbackThread?.join(500)
        playbackThread = null
    }

    fun release() {
        clear()
        audioTrack?.release()
        audioTrack = null

        if (audioFocusGranted) {
            audioManager?.abandonAudioFocus(null)
            audioFocusGranted = false
        }
        audioManager = null
        Log.d(TAG, "AudioPlayback released")
    }

    val isActive: Boolean get() = isPlaying.get() && audioQueue.isNotEmpty()
}
