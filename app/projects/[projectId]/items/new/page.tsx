import Link from "next/link"
import { notFound } from "next/navigation"

import { AddItemForm } from "@/components/punch-list/add-item-form"
import { prisma } from "@/lib/prisma"

import type { Metadata } from "next"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ projectId: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { projectId } = await params
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true },
  })
  if (!project) return { title: "Project not found" }
  return { title: `New item — ${project.name}` }
}

export default async function NewItemPage({ params }: PageProps) {
  const { projectId } = await params
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true },
  })
  if (!project) notFound()

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href={`/projects/${project.id}`}
        className="text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
      >
        ← {project.name}
      </Link>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        Add a punch item
      </h1>
      <p className="mt-2 text-muted-foreground">
        Where, what, and how serious. Photo optional but recommended.
      </p>
      <div className="mt-6">
        <AddItemForm projectId={project.id} />
      </div>
    </div>
  )
}
