/**
 * AudioWorklet processor for microphone capture.
 * Forwards Float32 audio frames to the main thread via port.postMessage.
 * Replaces the deprecated ScriptProcessorNode.
 */
class CaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this._active = true

    this.port.onmessage = (event) => {
      if (event.data && event.data.command === 'stop') {
        this._active = false
      }
    }
  }

  process(inputs) {
    if (!this._active) return false

    const input = inputs[0]
    if (!input || input.length === 0) return true

    const channelData = input[0]
    if (channelData && channelData.length > 0) {
      // Copy the Float32 data and transfer it to the main thread
      const copy = new Float32Array(channelData)
      this.port.postMessage(copy.buffer, [copy.buffer])
    }

    return true
  }
}

registerProcessor('capture-processor', CaptureProcessor)
