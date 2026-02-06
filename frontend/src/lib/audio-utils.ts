/**
 * Audio utilities for Gemini Live API voice interaction.
 * Uses AudioWorklet for both capture and playback to avoid
 * race conditions and per-chunk AudioBufferSourceNode overhead.
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
 * AudioContext for playback at 24kHz (matches Gemini output — no resampling needed).
 */
let playbackContext: AudioContext | null = null

export function getPlaybackContext(): AudioContext {
  if (!playbackContext) {
    playbackContext = new AudioContext({ sampleRate: AUDIO_CONFIG.output.sampleRate })
  }
  return playbackContext
}

/**
 * Shared AudioContext for capture at 16kHz (Gemini's input sample rate)
 */
let captureContext: AudioContext | null = null

export function getCaptureContext(): AudioContext {
  if (!captureContext) {
    captureContext = new AudioContext({ sampleRate: AUDIO_CONFIG.input.sampleRate })
  }
  return captureContext
}

/**
 * Close and reset audio contexts (for cleanup)
 */
export function closeAudioContexts(): void {
  if (playbackContext) {
    playbackContext.close().catch(() => {})
    playbackContext = null
  }
  if (captureContext) {
    captureContext.close().catch(() => {})
    captureContext = null
  }
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
 * Creates an AudioWorklet-based audio processor that captures audio from the
 * microphone and converts it to base64-encoded PCM for Gemini Live API.
 * Also creates an AnalyserNode for audio level detection (visual feedback).
 */
export async function createAudioProcessor(
  stream: MediaStream,
  onAudioData: (base64Data: string) => void
): Promise<{ start: () => void; stop: () => void; analyser: AnalyserNode }> {
  const context = getCaptureContext()

  // Resume if suspended (browser autoplay policy)
  if (context.state === 'suspended') {
    await context.resume()
  }

  // Load the capture worklet module
  await context.audioWorklet.addModule('/capture.worklet.js')

  const source = context.createMediaStreamSource(stream)

  // Create analyser for audio level detection (used for visual feedback)
  const analyser = context.createAnalyser()
  analyser.fftSize = 256
  analyser.smoothingTimeConstant = 0.8

  // Create the AudioWorkletNode for capture
  const captureNode = new AudioWorkletNode(context, 'capture-processor')

  let isProcessing = false

  captureNode.port.onmessage = (event: MessageEvent) => {
    if (!isProcessing) return

    const float32Buffer = new Float32Array(event.data)

    // Convert Float32 to Int16 PCM
    const pcmData = float32ToInt16(float32Buffer)

    // Convert to base64
    const base64 = arrayBufferToBase64(pcmData.buffer as ArrayBuffer)

    onAudioData(base64)
  }

  return {
    start: () => {
      isProcessing = true
      // Chain: source → analyser → captureNode
      source.connect(analyser)
      analyser.connect(captureNode)
      // Connect captureNode to destination to keep it alive (outputs silence)
      captureNode.connect(context.destination)
    },
    stop: () => {
      isProcessing = false
      captureNode.port.postMessage({ command: 'stop' })
      captureNode.disconnect()
      analyser.disconnect()
      source.disconnect()
    },
    analyser
  }
}

/**
 * WorkletPlaybackManager — manages audio playback via an AudioWorklet ring buffer.
 * A single worklet processor continuously reads from a circular buffer on a
 * dedicated audio thread. No scheduling, no race conditions, no per-chunk source nodes.
 */
export class WorkletPlaybackManager {
  private playbackNode: AudioWorkletNode | null = null
  private initialized = false

  async initialize(): Promise<void> {
    if (this.initialized) return

    const ctx = getPlaybackContext()

    // Resume if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }

    // Load the playback worklet module
    await ctx.audioWorklet.addModule('/playback.worklet.js')

    // Create the worklet node (mono output at 24kHz context rate)
    this.playbackNode = new AudioWorkletNode(ctx, 'playback-processor', {
      outputChannelCount: [1]
    })
    this.playbackNode.connect(ctx.destination)

    this.initialized = true
  }

  enqueue(base64Data: string): void {
    if (!this.playbackNode) return

    // Decode base64 to ArrayBuffer (Int16 PCM)
    const pcmBuffer = base64ToArrayBuffer(base64Data)

    // Transfer the buffer to the worklet thread (zero-copy)
    this.playbackNode.port.postMessage(pcmBuffer, [pcmBuffer])
  }

  clear(): void {
    if (!this.playbackNode) return
    this.playbackNode.port.postMessage({ command: 'endOfAudio' })
  }

  dispose(): void {
    if (this.playbackNode) {
      this.playbackNode.port.postMessage({ command: 'endOfAudio' })
      this.playbackNode.disconnect()
      this.playbackNode = null
    }
    this.initialized = false
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
 * Check if the browser supports required audio APIs
 */
export function checkAudioSupport(): { supported: boolean; error?: string } {
  try {
    // Guard for non-browser environments (e.g., Storybook, SSR)
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return {
        supported: false,
        error: 'Voice features are not available in this environment.'
      }
    }

    // Check HTTPS requirement (getUserMedia requires secure context)
    if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return {
        supported: false,
        error: 'Voice features require HTTPS for security. Please use https:// instead of http://'
      }
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return {
        supported: false,
        error: 'Browser does not support microphone access. Try Chrome, Firefox, or Safari.'
      }
    }

    if (!window.AudioContext && !(window as unknown as { webkitAudioContext: unknown }).webkitAudioContext) {
      return {
        supported: false,
        error: 'Browser does not support Web Audio API. Please use a modern browser.'
      }
    }

    // AudioWorklet is required for capture and playback
    if (!window.AudioContext || !AudioContext.prototype.audioWorklet) {
      return {
        supported: false,
        error: 'Browser does not support AudioWorklet. Please update to Chrome 66+, Firefox 76+, or Safari 14.1+.'
      }
    }

    if (!window.WebSocket) {
      return {
        supported: false,
        error: 'Browser does not support WebSocket connections.'
      }
    }

    return { supported: true }
  } catch {
    return {
      supported: false,
      error: 'Voice features are not available in this environment.'
    }
  }
}
