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

  // Verify the project exists before inserting — surface a clean
  // ActionResult instead of letting Prisma's FK violation propagate
  // to the global error boundary.
  const project = await prisma.project.findUnique({
    where: { id: parsed.data.projectId },
    select: { id: true },
  })
  if (!project) {
    return { ok: false, error: "Project not found." }
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
  const {
    projectId,
    itemId,
    fromStatus,
    toStatus,
    completionPhoto,
    assignedTo,
  } = parsed.data

  if (!canTransition(fromStatus, toStatus)) {
    return { ok: false, error: VALIDATION_ERRORS.invalidTransition }
  }

  if (requiresCompletionPhoto(fromStatus, toStatus) && !completionPhoto) {
    return { ok: false, error: VALIDATION_ERRORS.missingPhoto }
  }

  // Wrap read + update in a single transaction with a row-level lock
  // to close the TOCTOU window between the existence/assignee read
  // and the optimistic-concurrency write.
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.$queryRaw<
      Array<{
        assignedTo: string | null
        deletedAt: Date | null
        projectId: string
      }>
    >`
      SELECT "assignedTo", "deletedAt", "projectId"
      FROM "PunchItem"
      WHERE "id" = ${itemId}
      FOR UPDATE
    `
    const row = existing[0]
    if (!row || row.deletedAt) {
      return { kind: "not_found" as const }
    }
    // Defense-in-depth project scope check — even if the WHERE fails
    // later, a forged itemId from a different project is rejected
    // here.
    if (row.projectId !== projectId) {
      return { kind: "not_found" as const }
    }

    const effectiveAssignee = assignedTo ?? row.assignedTo
    if (
      requiresAssignee(toStatus) &&
      (!effectiveAssignee || effectiveAssignee.trim() === "")
    ) {
      return { kind: "missing_assignee" as const }
    }

    const effects = transitionSideEffects(fromStatus, toStatus)

    const update = await tx.punchItem.updateMany({
      where: {
        id: itemId,
        projectId,
        status: fromStatus,
        deletedAt: null,
      },
      data: {
        status: toStatus,
        ...(completionPhoto !== undefined ? { completionPhoto } : {}),
        ...(effectiveAssignee !== row.assignedTo
          ? { assignedTo: effectiveAssignee }
          : {}),
        ...effects,
      },
    })

    return {
      kind: "ok" as const,
      count: update.count,
      projectId: row.projectId,
    }
  })

  if (result.kind === "not_found") {
    return { ok: false, error: VALIDATION_ERRORS.staleState }
  }
  if (result.kind === "missing_assignee") {
    return { ok: false, error: VALIDATION_ERRORS.missingAssignee }
  }
  if (result.count === 0) {
    return { ok: false, error: VALIDATION_ERRORS.staleState }
  }

  revalidatePath(`/projects/${result.projectId}`)
  revalidatePath(`/projects/${result.projectId}/items/${itemId}`)
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
  const { projectId, itemId, assignedTo } = parsed.data

  // updateMany scopes to (id, projectId, deletedAt:null) so soft-deleted
  // items cannot be reassigned (audit-trail invariant) and an itemId
  // forged against the wrong project is rejected.
  const result = await prisma.punchItem.updateMany({
    where: { id: itemId, projectId, deletedAt: null },
    data: { assignedTo },
  })
  if (result.count === 0) {
    return { ok: false, error: "Item not found." }
  }

  revalidatePath(`/projects/${projectId}`)
  revalidatePath(`/projects/${projectId}/items/${itemId}`)
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
  const { projectId, itemId } = parsed.data

  // updateMany with deletedAt:null guard ensures double-delete races
  // don't overwrite the original deletion timestamp (audit trail
  // integrity), and that an itemId from another project is rejected.
  const result = await prisma.punchItem.updateMany({
    where: { id: itemId, projectId, deletedAt: null },
    data: { deletedAt: new Date() },
  })
  if (result.count === 0) {
    return { ok: false, error: "Item not found." }
  }

  revalidatePath(`/projects/${projectId}`)
  return { ok: true, data: undefined }
}
