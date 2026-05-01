// Zod schemas for all server-action inputs. Schemas derive their enum
// values from `lib/state.ts` so adding a status or priority there
// propagates here automatically. Types come back via `z.infer`, so
// there is exactly one place a status string is declared in the app.

import { z } from "zod"

import { ITEM_PRIORITIES, ITEM_STATUSES } from "@/lib/state"

const trimmedNonEmpty = (max: number) =>
  z.string().trim().min(1, "Required").max(max, `Max ${max} characters`)

export const PriorityEnum = z.enum(ITEM_PRIORITIES)
export const StatusEnum = z.enum(ITEM_STATUSES)

// Project ----------------------------------------------------------

export const CreateProjectInput = z.object({
  name: trimmedNonEmpty(200),
  address: trimmedNonEmpty(500),
})
export type CreateProjectInput = z.infer<typeof CreateProjectInput>

// Punch item -------------------------------------------------------

export const CreateItemInput = z.object({
  projectId: z.string().uuid("Invalid project id"),
  location: trimmedNonEmpty(200),
  description: trimmedNonEmpty(2000),
  priority: PriorityEnum.default("normal"),
  assignedTo: z
    .string()
    .trim()
    .max(120, "Max 120 characters")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  photo: z
    .string()
    .url("Invalid photo URL")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
})
export type CreateItemInput = z.infer<typeof CreateItemInput>

export const TransitionStatusInput = z.object({
  itemId: z.string().uuid("Invalid item id"),
  fromStatus: StatusEnum,
  toStatus: StatusEnum,
  completionPhoto: z
    .string()
    .url("Invalid photo URL")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  assignedTo: z
    .string()
    .trim()
    .max(120, "Max 120 characters")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
})
export type TransitionStatusInput = z.infer<typeof TransitionStatusInput>

export const AssignWorkerInput = z.object({
  itemId: z.string().uuid("Invalid item id"),
  assignedTo: trimmedNonEmpty(120),
})
export type AssignWorkerInput = z.infer<typeof AssignWorkerInput>

export const SoftDeleteItemInput = z.object({
  itemId: z.string().uuid("Invalid item id"),
})
export type SoftDeleteItemInput = z.infer<typeof SoftDeleteItemInput>

// Generic action result type used by every Server Action so callers
// always get a typed success/error shape and never have to try/catch
// at the form-handling boundary.

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> }
