"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import {
  canTransition,
  requiresAssignee,
  requiresCompletionPhoto,
  transitionSideEffects,
} from "@/lib/state"
import {
  AssignWorkerInput,
  CreateItemInput,
  SoftDeleteItemInput,
  TransitionStatusInput,
} from "@/lib/validators"
import type { ActionResult } from "@/lib/validators"
import { VALIDATION_ERRORS } from "@/lib/copy"

function formError(
  err: ReturnType<
    | typeof CreateItemInput.safeParse
    | typeof TransitionStatusInput.safeParse
    | typeof AssignWorkerInput.safeParse
    | typeof SoftDeleteItemInput.safeParse
  >,
): ActionResult {
  if (err.success) return { ok: true, data: undefined }
  return {
    ok: false,
    error: "Please fix the errors below.",
    fieldErrors: err.error.flatten().fieldErrors as Record<string, string[]>,
  }
}

// ---------------------------------------------------------------- create

export async function createItem(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const parsed = CreateItemInput.safeParse({
    projectId: formData.get("projectId"),
    location: formData.get("location"),
    description: formData.get("description"),
    priority: formData.get("priority") || undefined,
    assignedTo: formData.get("assignedTo") || undefined,
    photo: formData.get("photo") || undefined,
  })
  if (!parsed.success) {
    return formError(parsed) as ActionResult<{ id: string }>
  }

  const item = await prisma.punchItem.create({
    data: parsed.data,
    select: { id: true, projectId: true },
  })

  revalidatePath(`/projects/${item.projectId}`)
  return { ok: true, data: { id: item.id } }
}

// ---------------------------------------------------------------- transition

export async function transitionStatus(
  input: unknown,
): Promise<ActionResult<{ status: string }>> {
  const parsed = TransitionStatusInput.safeParse(input)
  if (!parsed.success) {
    return formError(parsed) as ActionResult<{ status: string }>
  }
  const { itemId, fromStatus, toStatus, completionPhoto, assignedTo } =
    parsed.data

  if (!canTransition(fromStatus, toStatus)) {
    return { ok: false, error: VALIDATION_ERRORS.invalidTransition }
  }

  if (requiresCompletionPhoto(fromStatus, toStatus) && !completionPhoto) {
    return { ok: false, error: VALIDATION_ERRORS.missingPhoto }
  }

  // Read the current row to validate assignee presence and to know which
  // path to revalidate on success. We also use it to widen the optimistic
  // concurrency WHERE clause so a parallel assignee update in another tab
  // doesn't get clobbered.
  const existing = await prisma.punchItem.findUnique({
    where: { id: itemId },
    select: {
      assignedTo: true,
      projectId: true,
      deletedAt: true,
    },
  })
  if (!existing || existing.deletedAt) {
    return { ok: false, error: "Item not found." }
  }

  const effectiveAssignee = assignedTo ?? existing.assignedTo
  if (
    requiresAssignee(toStatus) &&
    (!effectiveAssignee || effectiveAssignee.trim() === "")
  ) {
    return { ok: false, error: VALIDATION_ERRORS.missingAssignee }
  }

  const effects = transitionSideEffects(fromStatus, toStatus)

  // Optimistic concurrency. The WHERE clause matches BOTH the expected
  // fromStatus AND the expected assignee value — so a concurrent
  // transition or a concurrent assignment in another tab fails this
  // update atomically (count === 0). Then we surface staleState to the
  // user so they can refresh.
  const result = await prisma.punchItem.updateMany({
    where: {
      id: itemId,
      status: fromStatus,
      assignedTo: existing.assignedTo,
      deletedAt: null,
    },
    data: {
      status: toStatus,
      ...(completionPhoto !== undefined ? { completionPhoto } : {}),
      ...(effectiveAssignee !== existing.assignedTo
        ? { assignedTo: effectiveAssignee }
        : {}),
      ...effects,
    },
  })

  if (result.count === 0) {
    return { ok: false, error: VALIDATION_ERRORS.staleState }
  }

  revalidatePath(`/projects/${existing.projectId}`)
  revalidatePath(`/projects/${existing.projectId}/items/${itemId}`)
  return { ok: true, data: { status: toStatus } }
}

// ---------------------------------------------------------------- assign

export async function assignWorker(
  input: unknown,
): Promise<ActionResult> {
  const parsed = AssignWorkerInput.safeParse(input)
  if (!parsed.success) {
    return formError(parsed)
  }
  const { itemId, assignedTo } = parsed.data

  const item = await prisma.punchItem.update({
    where: { id: itemId },
    data: { assignedTo },
    select: { projectId: true },
  })

  revalidatePath(`/projects/${item.projectId}`)
  revalidatePath(`/projects/${item.projectId}/items/${itemId}`)
  return { ok: true, data: undefined }
}

// ---------------------------------------------------------------- delete

export async function softDeleteItem(
  input: unknown,
): Promise<ActionResult> {
  const parsed = SoftDeleteItemInput.safeParse(input)
  if (!parsed.success) {
    return formError(parsed)
  }

  const item = await prisma.punchItem.update({
    where: { id: parsed.data.itemId },
    data: { deletedAt: new Date() },
    select: { projectId: true },
  })

  revalidatePath(`/projects/${item.projectId}`)
  return { ok: true, data: undefined }
}
