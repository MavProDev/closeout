import { CheckCircle2, MapPin } from "lucide-react"
import type { Route } from "next"
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

export const dynamic = "force-dynamic"

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
    orderBy: [{ createdAt: "desc" }],
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

  // Sort by lifecycle position (open → in_progress → complete → verified)
  // then createdAt desc within each bucket. Prisma `orderBy: status` is
  // alphabetical, which is the wrong reading order for a punch list.
  const STATUS_RANK: Record<ItemStatus, number> = {
    open: 0,
    in_progress: 1,
    complete: 2,
    verified: 3,
  }
  const itemCards: ItemCardData[] = items
    .map((i) => ({
      ...i,
      status: i.status as ItemStatus,
      priority: i.priority as ItemPriority,
    }))
    .sort((a, b) => {
      const rank = STATUS_RANK[a.status] - STATUS_RANK[b.status]
      if (rank !== 0) return rank
      return b.createdAt.getTime() - a.createdAt.getTime()
    })

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

      {isClosed && (
        <section
          className="mt-4 flex items-start gap-3 rounded-md border p-4 text-sm"
          style={{
            background:
              "color-mix(in oklab, var(--color-status-verified) 8%, var(--color-card))",
            borderColor:
              "color-mix(in oklab, var(--color-status-verified) 40%, transparent)",
          }}
          role="status"
          aria-live="polite"
        >
          <CheckCircle2
            className="mt-0.5 h-5 w-5 shrink-0"
            style={{ color: "var(--color-status-verified)" }}
            aria-hidden
          />
          <div className="space-y-0.5">
            <p
              className="font-semibold"
              style={{ color: "var(--color-status-verified)" }}
            >
              Closed for retainage release
            </p>
            <p className="text-muted-foreground">
              All {dashboard.totalItems} items signed off by GC. Reopening
              any verified item rolls the project back to active and
              creates an audit-trail entry on the affected item.
            </p>
          </div>
        </section>
      )}

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
        href={`/projects/${project.id}/items/new` as Route}
        label="Add item"
      />
    </div>
  )
}
