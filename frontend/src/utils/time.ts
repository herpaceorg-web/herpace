/**
 * Converts seconds to HH:MM:SS format for API
 * @param seconds - Total seconds
 * @returns Time string in HH:MM:SS format
 */
export function secondsToTimeSpan(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * Parses HH:MM:SS format to seconds
 * @param timeSpan - Time string in HH:MM:SS format
 * @returns Total seconds
 */
export function timeSpanToSeconds(timeSpan: string): number {
  const parts = timeSpan.split(':').map(Number)
  if (parts.length !== 3) return 0

  const [hours, minutes, seconds] = parts
  return hours * 3600 + minutes * 60 + seconds
}

/**
 * Validates HH:MM:SS format
 * @param time - Time string to validate
 * @returns True if valid format
 */
export function isValidTimeFormat(time: string): boolean {
  return /^(\d{1,2}):([0-5]\d):([0-5]\d)$/.test(time)
}
