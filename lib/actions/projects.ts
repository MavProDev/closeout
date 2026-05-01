"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { prisma } from "@/lib/prisma"
import { CreateProjectInput } from "@/lib/validators"
import type { ActionResult } from "@/lib/validators"

export async function createProject(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const parsed = CreateProjectInput.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
  })

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    }
  }

  const project = await prisma.project.create({
    data: parsed.data,
    select: { id: true },
  })

  revalidatePath("/")
  redirect(`/projects/${project.id}`)
}
