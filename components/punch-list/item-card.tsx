"use client"

import { CheckCircle2, ImageIcon, Trash2, User } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import {
  PriorityPill,
  StatusPill,
} from "@/components/punch-list/status-pill"
import { TransitionDialog } from "@/components/punch-list/transition-dialog"
import { Button } from "@/components/ui/button"
import { softDeleteItem } from "@/lib/actions/items"
import { SUCCESS_TOASTS } from "@/lib/copy"
import type { ItemPriority, ItemStatus } from "@/lib/state"
import { cn, formatRelativeTime } from "@/lib/utils"

export interface ItemCardData {
  id: string
  projectId: string
  location: string
  description: string
  status: ItemStatus
  priority: ItemPriority
  assignedTo: string | null
  photo: string | null
  completionPhoto: string | null
  createdAt: Date
  updatedAt: Date
  completedAt: Date | null
  verifiedAt: Date | null
}

interface ItemCardProps {
  item: ItemCardData
  className?: string
}

export function ItemCard({ item, className }: ItemCardProps) {
  const [pending, startTransition] = React.useTransition()
  const router = useRouter()

  function handleDelete() {
    if (
      !window.confirm(
        "Soft-delete this item? It stays in the audit trail.",
      )
    ) {
      return
    }
    startTransition(async () => {
      const result = await softDeleteItem({
        projectId: item.projectId,
        itemId: item.id,
      })
      if (!result.ok) toast.error(result.error)
      else {
        toast.success(SUCCESS_TOASTS.itemDeleted)
        router.refresh()
      }
    })
  }

  const showCompletion = Boolean(item.completionPhoto)

  return (
    <article
      className={cn(
        "surface group relative animate-fade-in-scale overflow-hidden",
        className,
      )}
      data-status={item.status}
    >
      <div className="flex flex-col gap-0 sm:flex-row">
        <div className="grid shrink-0 grid-cols-2 gap-px bg-border sm:grid-cols-1 sm:gap-0">
          <ItemPhoto
            src={item.photo}
            label="Defect"
            className="aspect-[4/3] sm:aspect-square sm:h-32 sm:w-32"
          />
          {showCompletion && (
            <ItemPhoto
              src={item.completionPhoto}
              label="Fix"
              accent
              className="aspect-[4/3] sm:aspect-square sm:h-32 sm:w-32"
            />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href={`/projects/${item.projectId}/items/${item.id}`}
                className="line-clamp-1 font-medium hover:underline"
              >
                {item.location}
              </Link>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {item.description}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <PriorityPill priority={item.priority} size="sm" />
              <TransitionDialog
                projectId={item.projectId}
                itemId={item.id}
                currentStatus={item.status}
                hasAssignee={Boolean(item.assignedTo)}
              >
                {(open) => (
                  <StatusPill
                    status={item.status}
                    interactive
                    size="sm"
                    onClick={open}
                  />
                )}
              </TransitionDialog>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <User className="h-3 w-3" />
              {item.assignedTo ?? "Unassigned"}
            </span>
            {item.verifiedAt ? (
              <span
                className="inline-flex items-center gap-1.5"
                style={{ color: "var(--color-status-verified)" }}
              >
                <CheckCircle2 className="h-3 w-3" />
                Signed off {formatRelativeTime(item.verifiedAt)}
              </span>
            ) : item.completedAt ? (
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3" />
                Completed {formatRelativeTime(item.completedAt)}
              </span>
            ) : (
              <span>Reported {formatRelativeTime(item.createdAt)}</span>
            )}
          </div>
        </div>

        <div className="flex items-start justify-end p-2 sm:p-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={pending}
            aria-label="Soft-delete item"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </article>
  )
}

function ItemPhoto({
  src,
  label,
  accent,
  className,
}: {
  src: string | null
  label: string
  accent?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-secondary/40",
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={`${label} photo`}
          fill
          sizes="(max-width: 640px) 50vw, 200px"
          className="object-cover"
        />
      ) : (
        <div className="grid h-full place-items-center text-muted-foreground">
          <ImageIcon className="h-6 w-6" />
        </div>
      )}
      <span
        className={cn(
          "pointer-events-none absolute left-1.5 top-1.5 rounded-sm px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider backdrop-blur",
          accent
            ? "bg-[color:var(--color-status-verified)]/15 text-[color:var(--color-status-verified)]"
            : "bg-background/70 text-muted-foreground",
        )}
      >
        {label}
      </span>
    </div>
  )
}

