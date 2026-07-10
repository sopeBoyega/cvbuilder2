import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const relativeTime = new Intl.RelativeTimeFormat("en", { numeric: "auto" })

/** "2 hours ago", "3 days ago", "just now". */
export function timeAgo(date: Date): string {
  const seconds = Math.round((date.getTime() - Date.now()) / 1000)
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ]
  for (const [unit, secondsPerUnit] of units) {
    if (Math.abs(seconds) >= secondsPerUnit) {
      return relativeTime.format(Math.round(seconds / secondsPerUnit), unit)
    }
  }
  return "just now"
}
