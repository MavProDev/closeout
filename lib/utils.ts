import clsx, { type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—"
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function formatRelativeTime(
  date: Date | string | null | undefined,
): string {
  if (!date) return "—"
  const d = typeof date === "string" ? new Date(date) : date
  const diffMs = Date.now() - d.getTime()
  const diffMin = Math.round(diffMs / 60_000)
  if (diffMin < 1) return "just now"
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr} hr ago`
  const diffDay = Math.round(diffHr / 24)
  if (diffDay < 30)
    return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`
  return d.toLocaleDateString()
}

/**
 * Pluralize a word given a count. American-English -s only; rare
 * irregulars are passed in via the optional `plural` param.
 */
export function pluralize(
  count: number,
  singular: string,
  plural?: string,
): string {
  return count === 1 ? singular : (plural ?? `${singular}s`)
}

/**
 * Round a fraction to a percentage integer. Returns 0 for empty totals
 * (matches the dashboard "no items" empty state).
 */
export function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0
  return Math.round((numerator / denominator) * 100)
}

export function assertNever(value: never): never {
  throw new Error(`Unhandled value: ${String(value)}`)
}
