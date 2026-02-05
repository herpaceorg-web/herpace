/**
 * Audio utilities for Gemini Live API voice interaction.
 * Handles microphone capture and audio playback.
 */

// Audio configuration for Gemini Live API
export const AUDIO_CONFIG = {
  // Input audio requirements
  input: {
    sampleRate: 16000,
    channelCount: 1,
    bitsPerSample: 16
  },
  // Output audio from Gemini
  output: {
    sampleRate: 24000,
    channelCount: 1
  }
} as const

/**
 * Audio context singleton for reuse
 * Uses hardware sample rate for best compatibility
 */
let audioContext: AudioContext | null = null

export function getAudioContext(): AudioContext {
  if (!audioContext) {
    // Use hardware's native sample rate (typically 44.1kHz or 48kHz)
    // We'll resample Gemini's 24kHz audio to match
    audioContext = new AudioContext()
  }
  return audioContext
}

/**
 * Request microphone permissions and create a media stream
 */
export async function requestMicrophoneAccess(): Promise<MediaStream> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: AUDIO_CONFIG.input.sampleRate,
        channelCount: AUDIO_CONFIG.input.channelCount,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    })
    return stream
  } catch (error) {
    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError') {
        throw new Error('Microphone permission denied. Please allow microphone access to use voice features.')
      } else if (error.name === 'NotFoundError') {
        throw new Error('No microphone found. Please connect a microphone to use voice features.')
      }
    }
    throw error
  }
}

/**
 * Creates an audio processor that captures audio from the microphone
 * and converts it to base64-encoded PCM for Gemini Live API
 */
export function createAudioProcessor(
  stream: MediaStream,
  onAudioData: (base64Data: string) => void
): { start: () => void; stop: () => void } {
  const context = new AudioContext({ sampleRate: AUDIO_CONFIG.input.sampleRate })
  const source = context.createMediaStreamSource(stream)

  // Use ScriptProcessorNode for audio processing
  // (AudioWorklet would be better but requires more setup)
  const bufferSize = 4096
  const processor = context.createScriptProcessor(bufferSize, 1, 1)

  let isProcessing = false

  processor.onaudioprocess = (event) => {
    if (!isProcessing) return

    const inputBuffer = event.inputBuffer.getChannelData(0)

    // Convert Float32 to Int16 PCM
    const pcmData = float32ToInt16(inputBuffer)

    // Convert to base64
    const base64 = arrayBufferToBase64(pcmData.buffer as ArrayBuffer)

    onAudioData(base64)
  }

  return {
    start: () => {
      isProcessing = true
      source.connect(processor)
      processor.connect(context.destination)
    },
    stop: () => {
      isProcessing = false
      processor.disconnect()
      source.disconnect()
      context.close()
    }
  }
}

/**
 * Convert Float32Array (Web Audio API format) to Int16Array (PCM format)
 */
export function float32ToInt16(float32Array: Float32Array): Int16Array {
  const int16Array = new Int16Array(float32Array.length)
  for (let i = 0; i < float32Array.length; i++) {
    // Clamp value between -1 and 1, then scale to Int16 range
    const s = Math.max(-1, Math.min(1, float32Array[i]))
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  return int16Array
}

/**
 * Convert ArrayBuffer to base64 string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Convert base64 string to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

/**
 * Play PCM audio data from Gemini (24kHz, 16-bit, mono)
 * Returns the BufferSource for scheduling and cleanup
 */
export async function playPcmAudio(
  base64Data: string,
  startTime?: number
): Promise<{ source: AudioBufferSourceNode; duration: number }> {
  const context = getAudioContext()

  // Resume context if suspended (browser autoplay policy)
  if (context.state === 'suspended') {
    await context.resume()
  }

  // Decode base64 to ArrayBuffer
  const pcmData = base64ToArrayBuffer(base64Data)

  // Convert Int16 PCM to Float32 for Web Audio API
  const int16Array = new Int16Array(pcmData)
  const float32Array = new Float32Array(int16Array.length)

  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / (int16Array[i] < 0 ? 0x8000 : 0x7fff)
  }

  // Create audio buffer with proper sample rate
  // Gemini sends 24kHz audio, but we need to resample to hardware rate
  const audioBuffer = context.createBuffer(
    AUDIO_CONFIG.output.channelCount,
    float32Array.length,
    AUDIO_CONFIG.output.sampleRate // 24kHz source rate
  )

  audioBuffer.getChannelData(0).set(float32Array)

  // Create and configure the audio source
  const source = context.createBufferSource()
  source.buffer = audioBuffer
  source.connect(context.destination)

  // Calculate actual duration in seconds
  const duration = audioBuffer.duration

  // Start playback at specified time or immediately
  if (startTime !== undefined && startTime > context.currentTime) {
    source.start(startTime)
  } else {
    source.start()
  }

  // Auto-disconnect after playback to prevent memory leaks
  source.onended = () => {
    source.disconnect()
  }

  return { source, duration }
}

/**
 * Audio queue for managing sequential playback of audio chunks
 * with seamless scheduling and pre-buffering
 */
export class AudioQueue {
  private queue: string[] = []
  private isPlaying = false
  private nextScheduledTime = 0
  private activeSources: AudioBufferSourceNode[] = []
  private readonly PRE_BUFFER_COUNT = 2 // Buffer 2 chunks before starting playback

  async enqueue(base64Data: string): Promise<void> {
    this.queue.push(base64Data)

    // Start playback only after pre-buffering initial chunks
    if (!this.isPlaying && this.queue.length >= this.PRE_BUFFER_COUNT) {
      this.startPlayback()
    }
  }

  private startPlayback(): void {
    if (this.isPlaying) return

    this.isPlaying = true
    const context = getAudioContext()

    // Initialize scheduling time with a small buffer (100ms) to allow for processing
    this.nextScheduledTime = context.currentTime + 0.1

    // Schedule all queued chunks
    this.scheduleNext()
  }

  private async scheduleNext(): Promise<void> {
    while (this.queue.length > 0) {
      const audioData = this.queue.shift()!

      try {
        const context = getAudioContext()

        // If we're behind schedule, reset to current time
        if (this.nextScheduledTime < context.currentTime) {
          this.nextScheduledTime = context.currentTime
        }

        const { source, duration } = await playPcmAudio(audioData, this.nextScheduledTime)

        // Track active source for cleanup
        this.activeSources.push(source)

        // Remove from tracking when it ends
        source.onended = () => {
          const index = this.activeSources.indexOf(source)
          if (index > -1) {
            this.activeSources.splice(index, 1)
          }
          source.disconnect()
        }

        // Schedule next chunk to start exactly when this one ends (seamless playback)
        this.nextScheduledTime += duration

      } catch (error) {
        console.error('Error scheduling audio:', error)
        // Continue with next chunk despite error
      }
    }

    this.isPlaying = false
  }

  clear(): void {
    // Stop and disconnect all active sources
    this.activeSources.forEach(source => {
      try {
        source.stop()
        source.disconnect()
      } catch (error) {
        // Source may have already ended
      }
    })

    this.activeSources = []
    this.queue = []
    this.isPlaying = false
    this.nextScheduledTime = 0
  }

  get length(): number {
    return this.queue.length
  }
}

/**
 * Check if the browser supports required audio APIs
 */
export function checkAudioSupport(): { supported: boolean; error?: string } {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return {
      supported: false,
      error: 'Your browser does not support microphone access. Please use a modern browser like Chrome, Firefox, or Safari.'
    }
  }

  if (!window.AudioContext && !(window as unknown as { webkitAudioContext: unknown }).webkitAudioContext) {
    return {
      supported: false,
      error: 'Your browser does not support Web Audio API. Please use a modern browser.'
    }
  }

  if (!window.WebSocket) {
    return {
      supported: false,
      error: 'Your browser does not support WebSocket connections.'
    }
  }

  return { supported: true }
}
