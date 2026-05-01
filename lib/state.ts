// Single source of truth for the punch list domain.
// Pure functions only. No React, no Prisma, no I/O.
// Importable by Server Actions, Server Components, and tests.
//
// Adding a status, priority, or transition is a one-line edit here.
// Validators (lib/validators.ts), UI copy (lib/copy.ts), and pill
// colors (app/globals.css) all derive from these constants.

export const ITEM_STATUSES = [
  "open",
  "in_progress",
  "complete",
  "verified",
] as const
export type ItemStatus = (typeof ITEM_STATUSES)[number]

export const ITEM_PRIORITIES = [
  "low",
  "normal",
  "high",
  "critical",
] as const
export type ItemPriority = (typeof ITEM_PRIORITIES)[number]

export const PROJECT_STATUSES = ["active", "closed"] as const
export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

/**
 * The state machine. The fourth state, `verified`, is the GC or owner
 * sign-off after physical reinspection. Without it a worker can mark
 * their own work complete with no proof. Industry sources (Smartsheet,
 * EB3, Kahua, Fieldwire) all converge on this four-state model.
 */
export const VALID_TRANSITIONS: Record<ItemStatus, readonly ItemStatus[]> = {
  open: ["in_progress"],
  in_progress: ["complete", "open"],
  complete: ["verified", "in_progress"],
  verified: ["in_progress"],
} as const

export function canTransition(from: ItemStatus, to: ItemStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to)
}

export function nextStatuses(from: ItemStatus): readonly ItemStatus[] {
  return VALID_TRANSITIONS[from]
}

/**
 * The completion-photo gate. The worker uploads proof when they finish
 * the work (`in_progress -> complete`). The verified transition is the
 * GC sign-off, a different actor, no new photo. Putting this gate on
 * the wrong transition was Override Moment 2 in planning.
 */
export function requiresCompletionPhoto(
  from: ItemStatus,
  to: ItemStatus,
): boolean {
  return from === "in_progress" && to === "complete"
}

/**
 * Items being or having been worked on must have an assignee.
 * The `* -> open` reopen path is the only assignee-free transition.
 */
export function requiresAssignee(
  _from: ItemStatus,
  to: ItemStatus,
): boolean {
  return to === "in_progress" || to === "complete" || to === "verified"
}

/**
 * Side effects on transition. Returned as a partial Prisma data object
 * so the action layer can spread it into its update call.
 */
export interface TransitionSideEffects {
  completedAt?: Date | null
  verifiedAt?: Date | null
}

export function transitionSideEffects(
  from: ItemStatus,
  to: ItemStatus,
  now: Date = new Date(),
): TransitionSideEffects {
  const effects: TransitionSideEffects = {}
  if (to === "complete") effects.completedAt = now
  if (to === "verified") effects.verifiedAt = now
  if (from === "verified" && to === "in_progress") {
    effects.verifiedAt = null
    effects.completedAt = null
  }
  if (from === "complete" && to === "in_progress") {
    effects.completedAt = null
  }
  return effects
}

/**
 * Compute project status from item counts. Project is "closed" when
 * 100 percent of non-deleted items are verified. Computed on render,
 * never written to the DB. The `Project.status` column stays at its
 * default 'active' to satisfy the spec's schema; the UI shows the
 * computed value.
 */
export function computeProjectStatus(
  totalItems: number,
  verifiedItems: number,
): ProjectStatus {
  if (totalItems === 0) return "active"
  return verifiedItems === totalItems ? "closed" : "active"
}

/**
 * Type guards. Useful when validating untrusted strings from request
 * bodies, query params, or DB rows.
 */
export function isItemStatus(value: unknown): value is ItemStatus {
  return (
    typeof value === "string" &&
    (ITEM_STATUSES as readonly string[]).includes(value)
  )
}

export function isItemPriority(value: unknown): value is ItemPriority {
  return (
    typeof value === "string" &&
    (ITEM_PRIORITIES as readonly string[]).includes(value)
  )
}
