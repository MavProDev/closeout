import "server-only"

import { prisma } from "@/lib/prisma"
import {
  ITEM_PRIORITIES,
  ITEM_STATUSES,
  type ItemPriority,
  type ItemStatus,
  type ProjectStatus,
  computeProjectStatus,
} from "@/lib/state"

export interface BreakdownEntry<T extends string> {
  key: T
  label: string
  count: number
}

export interface ProjectDashboard {
  totalItems: number
  verifiedItems: number
  completedItems: number
  inProgressItems: number
  openItems: number
  completionPct: number
  computedStatus: ProjectStatus
  byStatus: BreakdownEntry<ItemStatus>[]
  byPriority: BreakdownEntry<ItemPriority>[]
  byAssignee: BreakdownEntry<string>[]
  byLocation: BreakdownEntry<string>[]
}

/**
 * One round-trip aggregation for a project's dashboard. Issues four
 * `groupBy` queries in parallel so the page renders fast even on
 * a large punch list.
 */
export async function getProjectDashboard(
  projectId: string,
): Promise<ProjectDashboard> {
  const [statusRows, priorityRows, assigneeRows, locationRows, totalRow] =
    await Promise.all([
      prisma.punchItem.groupBy({
        by: ["status"],
        where: { projectId, deletedAt: null },
        _count: { _all: true },
      }),
      prisma.punchItem.groupBy({
        by: ["priority"],
        where: { projectId, deletedAt: null },
        _count: { _all: true },
      }),
      prisma.punchItem.groupBy({
        by: ["assignedTo"],
        where: { projectId, deletedAt: null, NOT: { assignedTo: null } },
        _count: { _all: true },
        orderBy: { _count: { assignedTo: "desc" } },
        take: 5,
      }),
      prisma.punchItem.groupBy({
        by: ["location"],
        where: { projectId, deletedAt: null },
        _count: { _all: true },
        orderBy: { _count: { location: "desc" } },
        take: 6,
      }),
      prisma.punchItem.aggregate({
        where: { projectId, deletedAt: null },
        _count: { _all: true },
      }),
    ])

  const statusCounts = new Map(
    statusRows.map((r) => [r.status as ItemStatus, r._count._all]),
  )
  const priorityCounts = new Map(
    priorityRows.map((r) => [r.priority as ItemPriority, r._count._all]),
  )

  // Status breakdown — always emits all four states in canonical order.
  const byStatus: BreakdownEntry<ItemStatus>[] = ITEM_STATUSES.map((s) => ({
    key: s,
    label: s,
    count: statusCounts.get(s) ?? 0,
  }))

  const byPriority: BreakdownEntry<ItemPriority>[] = ITEM_PRIORITIES.map(
    (p) => ({
      key: p,
      label: p,
      count: priorityCounts.get(p) ?? 0,
    }),
  )

  const byAssignee: BreakdownEntry<string>[] = assigneeRows
    .filter((r) => r.assignedTo !== null)
    .map((r) => ({
      key: r.assignedTo as string,
      label: r.assignedTo as string,
      count: r._count._all,
    }))

  // Top locations by item count. The spec called for this breakdown
  // by name; we cap at 6 to keep the card scannable on a phone.
  const byLocation: BreakdownEntry<string>[] = locationRows.map((r) => ({
    key: r.location,
    label: r.location,
    count: r._count._all,
  }))

  const totalItems = totalRow._count._all
  const verifiedItems = statusCounts.get("verified") ?? 0
  const completedItems = statusCounts.get("complete") ?? 0
  const inProgressItems = statusCounts.get("in_progress") ?? 0
  const openItems = statusCounts.get("open") ?? 0

  return {
    totalItems,
    verifiedItems,
    completedItems,
    inProgressItems,
    openItems,
    completionPct:
      totalItems === 0
        ? 0
        : Math.round((verifiedItems / totalItems) * 100),
    computedStatus: computeProjectStatus(totalItems, verifiedItems),
    byStatus,
    byPriority,
    byAssignee,
    byLocation,
  }
}

export interface ProjectListEntry {
  id: string
  name: string
  address: string
  createdAt: Date
  totalItems: number
  verifiedItems: number
  completionPct: number
  computedStatus: ProjectStatus
}

export async function listProjects(): Promise<ProjectListEntry[]> {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      address: true,
      createdAt: true,
      _count: { select: { items: { where: { deletedAt: null } } } },
      items: {
        where: { deletedAt: null, status: "verified" },
        select: { id: true },
      },
    },
  })

  return projects.map((p) => {
    const total = p._count.items
    const verified = p.items.length
    return {
      id: p.id,
      name: p.name,
      address: p.address,
      createdAt: p.createdAt,
      totalItems: total,
      verifiedItems: verified,
      completionPct: total === 0 ? 0 : Math.round((verified / total) * 100),
      computedStatus: computeProjectStatus(total, verified),
    }
  })
}
