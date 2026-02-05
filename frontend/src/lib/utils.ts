import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Distance conversion (backend always stores km)
const KM_TO_MI = 0.621371

export function kmToMi(km: number): number {
  return km * KM_TO_MI
}

export function miToKm(mi: number): number {
  return mi / KM_TO_MI
}

/** Convert a km value from the API for display in the user's preferred unit */
export function displayDistance(km: number, unit: 'km' | 'mi'): number {
  return parseFloat((unit === 'mi' ? kmToMi(km) : km).toFixed(2))
}

/** Convert a value the user entered (in their preferred unit) back to km for the API */
export function toKm(value: number, unit: 'km' | 'mi'): number {
  return unit === 'mi' ? miToKm(value) : value
}
