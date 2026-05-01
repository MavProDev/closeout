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
  _prev: ActionResult | null,
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

  // 1. The state machine must permit this transition.
  if (!canTransition(fromStatus, toStatus)) {
    return { ok: false, error: VALIDATION_ERRORS.invalidTransition }
  }

  // 2. The completion-photo gate: only on in_progress -> complete.
  if (requiresCompletionPhoto(fromStatus, toStatus) && !completionPhoto) {
    return { ok: false, error: VALIDATION_ERRORS.missingPhoto }
  }

  // 3. Assignee required for any active or completed state.
  // We check the in-flight payload first, then fall back to the row.
  const existing = await prisma.punchItem.findUnique({
    where: { id: itemId },
    select: { assignedTo: true, projectId: true },
  })
  if (!existing) {
    return { ok: false, error: "Item not found." }
  }
  const effectiveAssignee = assignedTo ?? existing.assignedTo
  if (
    requiresAssignee(fromStatus, toStatus) &&
    (!effectiveAssignee || effectiveAssignee.trim() === "")
  ) {
    return { ok: false, error: VALIDATION_ERRORS.missingAssignee }
  }

  const effects = transitionSideEffects(fromStatus, toStatus)

  // 4. Optimistic concurrency. The WHERE clause matches the expected
  //    fromStatus, so concurrent transitions in another tab fail
  //    atomically (count === 0).
  const result = await prisma.punchItem.updateMany({
    where: { id: itemId, status: fromStatus, deletedAt: null },
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
