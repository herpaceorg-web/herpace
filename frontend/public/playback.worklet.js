/**
 * AudioWorklet processor for PCM playback using a ring buffer.
 * Receives Int16 PCM chunks from the main thread, converts to Float32,
 * and continuously outputs audio from a circular buffer.
 *
 * Messages accepted via port.postMessage:
 *   - ArrayBuffer: Int16 PCM audio data to enqueue
 *   - { command: 'endOfAudio' }: clears the buffer immediately (for interruptions)
 */
class PlaybackProcessor extends AudioWorkletProcessor {
  constructor() {
    super()

    // 180 seconds at 24kHz = 4,320,000 samples
    this.bufferSize = 24000 * 180
    this.buffer = new Float32Array(this.bufferSize)
    this.writeIndex = 0
    this.readIndex = 0
    this.samplesAvailable = 0

    this.port.onmessage = (event) => {
      const data = event.data

      if (data && data.command === 'endOfAudio') {
        // Clear buffer instantly for interruptions
        this.writeIndex = 0
        this.readIndex = 0
        this.samplesAvailable = 0
        return
      }

      // Expect ArrayBuffer containing Int16 PCM data
      if (data instanceof ArrayBuffer) {
        const int16 = new Int16Array(data)
        const count = int16.length

        for (let i = 0; i < count; i++) {
          // Convert Int16 to Float32 [-1.0, 1.0]
          this.buffer[this.writeIndex] = int16[i] < 0
            ? int16[i] / 0x8000
            : int16[i] / 0x7FFF
          this.writeIndex = (this.writeIndex + 1) % this.bufferSize
        }

        this.samplesAvailable += count

        // If buffer overflows, advance read pointer to keep latest audio
        if (this.samplesAvailable > this.bufferSize) {
          const overflow = this.samplesAvailable - this.bufferSize
          this.readIndex = (this.readIndex + overflow) % this.bufferSize
          this.samplesAvailable = this.bufferSize
        }
      }
    }
  }

  process(_inputs, outputs) {
    const output = outputs[0]
    if (!output || output.length === 0) return true

    const channel = output[0]
    const framesToWrite = channel.length // typically 128 samples

    if (this.samplesAvailable >= framesToWrite) {
      for (let i = 0; i < framesToWrite; i++) {
        channel[i] = this.buffer[this.readIndex]
        this.readIndex = (this.readIndex + 1) % this.bufferSize
      }
      this.samplesAvailable -= framesToWrite
    } else {
      // Not enough data — output silence
      for (let i = 0; i < framesToWrite; i++) {
        channel[i] = 0
      }
    }

    return true
  }
}

registerProcessor('playback-processor', PlaybackProcessor)
