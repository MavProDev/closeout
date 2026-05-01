import { BreakdownBar } from "@/components/dashboard/breakdown-bar"
import { CompletionRing } from "@/components/dashboard/completion-ring"
import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/copy"
import type { ProjectDashboard } from "@/lib/dashboard"
import type { ItemPriority, ItemStatus } from "@/lib/state"
import { cn } from "@/lib/utils"

const STATUS_COLOR: Record<ItemStatus, string> = {
  open: "var(--color-status-open)",
  in_progress: "var(--color-status-in_progress)",
  complete: "var(--color-status-complete)",
  verified: "var(--color-status-verified)",
}

const PRIORITY_COLOR: Record<ItemPriority, string> = {
  low: "var(--color-priority-low)",
  normal: "var(--color-priority-normal)",
  high: "var(--color-priority-high)",
  critical: "var(--color-priority-critical)",
}

interface StatsRowProps {
  dashboard: ProjectDashboard
  className?: string
}

export function StatsRow({ dashboard, className }: StatsRowProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3",
        className,
      )}
    >
      <section className="surface flex items-center gap-4 p-4">
        <CompletionRing
          pct={dashboard.completionPct}
          label="verified"
          size={88}
        />
        <div className="min-w-0 space-y-1">
          <h3 className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Completion
          </h3>
          <p className="text-2xl font-semibold tabular-nums">
            {dashboard.verifiedItems}
            <span className="text-muted-foreground">
              {" "}
              / {dashboard.totalItems}
            </span>
          </p>
          <ul className="space-y-0.5 text-xs text-muted-foreground">
            {dashboard.completedItems > 0 && (
              <li
                className="tabular-nums"
                style={{ color: "var(--color-status-complete)" }}
              >
                {dashboard.completedItems} awaiting sign-off
              </li>
            )}
            {dashboard.inProgressItems > 0 && (
              <li
                className="tabular-nums"
                style={{ color: "var(--color-status-in_progress)" }}
              >
                {dashboard.inProgressItems} in progress
              </li>
            )}
            {dashboard.openItems > 0 && (
              <li className="tabular-nums">
                {dashboard.openItems} open
              </li>
            )}
            {dashboard.totalItems === 0 && (
              <li>No items yet.</li>
            )}
          </ul>
        </div>
      </section>

      <BreakdownBar
        title="By status"
        entries={dashboard.byStatus}
        total={dashboard.totalItems}
        colorFor={(k) => STATUS_COLOR[k]}
        formatLabel={(k) => STATUS_LABELS[k]}
        emptyText="No items yet."
      />

      <BreakdownBar
        title="By priority"
        entries={dashboard.byPriority}
        total={dashboard.totalItems}
        colorFor={(k) => PRIORITY_COLOR[k]}
        formatLabel={(k) => PRIORITY_LABELS[k]}
        emptyText="No items yet."
      />

      <BreakdownBar
        title="By assignee"
        entries={dashboard.byAssignee}
        total={dashboard.totalItems}
        colorFor={() => "var(--color-primary)"}
        emptyText="No assignments yet."
      />

      <BreakdownBar
        title="By location"
        entries={dashboard.byLocation}
        total={dashboard.totalItems}
        colorFor={() => "var(--color-status-complete)"}
        emptyText="No items yet."
      />
    </div>
  )
}
