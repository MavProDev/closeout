import { ArrowUpRight } from "lucide-react"
import Link from "next/link"

import { CompletionRing } from "@/components/dashboard/completion-ring"
import type { ProjectListEntry } from "@/lib/dashboard"
import { cn, formatDate } from "@/lib/utils"

interface ProjectCardProps {
  project: ProjectListEntry
  className?: string
}

export function ProjectCard({ project, className }: ProjectCardProps) {
  const isClosed = project.computedStatus === "closed"
  return (
    <Link
      href={`/projects/${project.id}`}
      className={cn(
        "surface group flex items-center gap-4 p-4 transition-colors hover:border-primary/50 hover:bg-secondary/40",
        className,
      )}
    >
      <CompletionRing pct={project.completionPct} size={64} strokeWidth={6} />
      <div className="min-w-0 flex-1">
        <h3 className="flex items-center gap-2 truncate font-semibold tracking-tight">
          {project.name}
          {isClosed && (
            <span
              className="rounded-full border px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider"
              style={{
                color: "var(--color-status-verified)",
                borderColor:
                  "color-mix(in oklab, var(--color-status-verified) 50%, transparent)",
                background:
                  "color-mix(in oklab, var(--color-status-verified) 12%, transparent)",
              }}
            >
              Closed
            </span>
          )}
        </h3>
        <p className="truncate text-sm text-muted-foreground">
          {project.address}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {project.verifiedItems} of {project.totalItems} verified ·
          opened {formatDate(project.createdAt)}
        </p>
      </div>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </Link>
  )
}
