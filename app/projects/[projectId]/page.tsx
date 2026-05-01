import { MapPin } from "lucide-react"
import { notFound } from "next/navigation"

import { StatsRow } from "@/components/dashboard/stats-row"
import { FloatingActionButton } from "@/components/layout/fab"
import { ItemList } from "@/components/punch-list/item-list"
import { type ItemCardData } from "@/components/punch-list/item-card"
import { StatusTabs } from "@/components/punch-list/status-tabs"
import { prisma } from "@/lib/prisma"
import { getProjectDashboard } from "@/lib/dashboard"
import {
  ITEM_STATUSES,
  type ItemPriority,
  type ItemStatus,
  isItemStatus,
} from "@/lib/state"
import { Button } from "@/components/ui/button"
import Link from "next/link"

import type { Metadata } from "next"

interface PageProps {
  params: Promise<{ projectId: string }>
  searchParams: Promise<{ status?: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { projectId } = await params
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true, address: true },
  })
  if (!project) return { title: "Project not found" }
  return {
    title: project.name,
    description: `${project.name} — ${project.address}. Punch list tracker.`,
  }
}

export default async function ProjectDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { projectId } = await params
  const { status: rawStatus } = await searchParams

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      address: true,
      createdAt: true,
    },
  })
  if (!project) notFound()

  const filter: ItemStatus | "all" = isItemStatus(rawStatus)
    ? rawStatus
    : "all"

  const dashboard = await getProjectDashboard(projectId)

  const items = await prisma.punchItem.findMany({
    where: {
      projectId,
      deletedAt: null,
      ...(filter !== "all" ? { status: filter } : {}),
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      projectId: true,
      location: true,
      description: true,
      status: true,
      priority: true,
      assignedTo: true,
      photo: true,
      completionPhoto: true,
      createdAt: true,
      updatedAt: true,
      completedAt: true,
      verifiedAt: true,
    },
  })

  const itemCards: ItemCardData[] = items.map((i) => ({
    ...i,
    status: i.status as ItemStatus,
    priority: i.priority as ItemPriority,
  }))

  const statusCounts = ITEM_STATUSES.reduce(
    (acc, s) => {
      acc[s] =
        dashboard.byStatus.find((b) => b.key === s)?.count ?? 0
      return acc
    },
    { open: 0, in_progress: 0, complete: 0, verified: 0 } as Record<
      ItemStatus,
      number
    >,
  )

  const isClosed = dashboard.computedStatus === "closed"

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/"
        className="text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
      >
        ← Projects
      </Link>

      <header className="surface mt-3 overflow-hidden">
        <div className="hatched absolute inset-x-0 top-0 h-1 opacity-50" />
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
              {project.name}
            </h1>
            <p className="mt-1.5 inline-flex items-center gap-1.5 truncate text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {project.address}
            </p>
          </div>
          <span
            className="pill"
            data-status={isClosed ? "verified" : "in_progress"}
          >
            {isClosed ? "Closed" : "Active"}
          </span>
        </div>
      </header>

      <section className="mt-4">
        <StatsRow dashboard={dashboard} />
      </section>

      <section className="mt-8">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Punch list
          </h2>
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href={`/projects/${project.id}/items/new`}>+ Add item</Link>
          </Button>
        </div>
        <div className="mt-3">
          <StatusTabs
            projectId={project.id}
            counts={statusCounts}
            total={dashboard.totalItems}
          />
        </div>
        <ItemList items={itemCards} filter={filter} />
      </section>

      <FloatingActionButton
        href={`/projects/${project.id}/items/new` as never}
        label="Add item"
      />
    </div>
  )
}
