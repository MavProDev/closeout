import { CheckCircle2, Clock, ImageIcon, MapPin, User } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

import {
  PriorityPill,
  StatusPill,
} from "@/components/punch-list/status-pill"
import { TransitionDialog } from "@/components/punch-list/transition-dialog"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import { STATUS_LABELS } from "@/lib/copy"
import { type ItemPriority, type ItemStatus } from "@/lib/state"
import { formatDate, formatRelativeTime } from "@/lib/utils"

import type { Metadata } from "next"

interface PageProps {
  params: Promise<{ projectId: string; itemId: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { itemId } = await params
  const item = await prisma.punchItem.findUnique({
    where: { id: itemId },
    select: { location: true },
  })
  if (!item) return { title: "Item not found" }
  return { title: item.location }
}

export default async function ItemDetailPage({ params }: PageProps) {
  const { projectId, itemId } = await params
  const item = await prisma.punchItem.findUnique({
    where: { id: itemId },
    include: { project: { select: { id: true, name: true } } },
  })
  if (!item || item.deletedAt || item.projectId !== projectId) notFound()

  const status = item.status as ItemStatus
  const priority = item.priority as ItemPriority

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href={`/projects/${item.project.id}`}
        className="text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
      >
        ← {item.project.name}
      </Link>

      <header className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {item.location}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {item.description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PriorityPill priority={priority} />
          <TransitionDialog
            itemId={item.id}
            currentStatus={status}
            hasAssignee={Boolean(item.assignedTo)}
          >
            {(open) => (
              <StatusPill status={status} interactive onClick={open} />
            )}
          </TransitionDialog>
        </div>
      </header>

      <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ItemPhoto src={item.photo} label="Defect" />
        <ItemPhoto src={item.completionPhoto} label="Completion" accent />
      </section>

      <section className="surface mt-6 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Audit trail
        </h2>
        <ul className="mt-3 space-y-2.5 text-sm">
          <Row icon={<MapPin className="h-3.5 w-3.5" />}>
            <span className="text-muted-foreground">Location:</span> {item.location}
          </Row>
          <Row icon={<User className="h-3.5 w-3.5" />}>
            <span className="text-muted-foreground">Assignee:</span> {item.assignedTo ?? "Unassigned"}
          </Row>
          <Row icon={<Clock className="h-3.5 w-3.5" />}>
            <span className="text-muted-foreground">Reported:</span> {formatDate(item.createdAt)} ·{" "}
            <span className="text-muted-foreground">{formatRelativeTime(item.createdAt)}</span>
          </Row>
          <Row icon={<Clock className="h-3.5 w-3.5" />}>
            <span className="text-muted-foreground">Last update:</span> {formatDate(item.updatedAt)} ·{" "}
            <span className="text-muted-foreground">{formatRelativeTime(item.updatedAt)}</span>
          </Row>
          {item.completedAt && (
            <Row icon={<CheckCircle2 className="h-3.5 w-3.5" />}>
              <span className="text-muted-foreground">Marked complete:</span>{" "}
              {formatDate(item.completedAt)}
            </Row>
          )}
          {item.verifiedAt && (
            <Row
              icon={
                <CheckCircle2
                  className="h-3.5 w-3.5"
                  style={{ color: "var(--color-status-verified)" }}
                />
              }
            >
              <span className="text-muted-foreground">GC sign-off:</span>{" "}
              {formatDate(item.verifiedAt)} ·{" "}
              <span style={{ color: "var(--color-status-verified)" }}>
                {STATUS_LABELS.verified}
              </span>
            </Row>
          )}
        </ul>
      </section>

      <div className="mt-6 flex justify-between">
        <Button asChild variant="outline">
          <Link href={`/projects/${item.project.id}`}>← Back to project</Link>
        </Button>
      </div>
    </div>
  )
}

function ItemPhoto({
  src,
  label,
  accent,
}: {
  src: string | null
  label: string
  accent?: boolean
}) {
  return (
    <div className="surface relative aspect-[4/3] overflow-hidden">
      {src ? (
        <Image
          src={src}
          alt={`${label} photo`}
          fill
          sizes="(max-width: 768px) 100vw, 400px"
          className="object-cover"
        />
      ) : (
        <div className="grid h-full place-items-center text-muted-foreground">
          <div className="flex flex-col items-center gap-2">
            <ImageIcon className="h-8 w-8" />
            <span className="text-xs">No {label.toLowerCase()} photo</span>
          </div>
        </div>
      )}
      <span
        className={
          accent
            ? "pointer-events-none absolute left-2 top-2 rounded-sm bg-[color:var(--color-status-verified)]/15 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-[color:var(--color-status-verified)] backdrop-blur"
            : "pointer-events-none absolute left-2 top-2 rounded-sm bg-background/70 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur"
        }
      >
        {label}
      </span>
    </div>
  )
}

function Row({
  icon,
  children,
}: {
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <li className="flex items-center gap-2">
      <span className="text-muted-foreground">{icon}</span>
      <span>{children}</span>
    </li>
  )
}
