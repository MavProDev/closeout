import type { BreakdownEntry } from "@/lib/dashboard"
import { cn } from "@/lib/utils"

interface BreakdownBarProps<T extends string> {
  title: string
  entries: readonly BreakdownEntry<T>[]
  total: number
  colorFor: (key: T) => string
  emptyText?: string
  formatLabel?: (key: T, label: string) => string
  className?: string
}

/**
 * One parameterized breakdown component handles three use cases:
 * status, priority, and assignee. The plan called for a single file
 * for all three; this is it. Bars are pure CSS — no Recharts, no
 * Framer. Width transitions on data change so the dashboard feels
 * responsive when items move.
 */
export function BreakdownBar<T extends string>({
  title,
  entries,
  total,
  colorFor,
  emptyText,
  formatLabel,
  className,
}: BreakdownBarProps<T>) {
  const hasData = total > 0 && entries.some((e) => e.count > 0)

  return (
    <section className={cn("surface p-4", className)}>
      <h3 className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {title}
      </h3>
      {!hasData ? (
        <p className="mt-3 text-sm text-muted-foreground">
          {emptyText ?? "No data yet."}
        </p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {entries.map((entry) => {
            const pct =
              total === 0 ? 0 : Math.round((entry.count / total) * 100)
            return (
              <li key={entry.key} className="space-y-1">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="truncate">
                    {formatLabel
                      ? formatLabel(entry.key, entry.label)
                      : entry.label}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {entry.count}
                  </span>
                </div>
                <div
                  className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border)]"
                  role="progressbar"
                  aria-valuenow={entry.count}
                  aria-valuemin={0}
                  aria-valuemax={total}
                >
                  <div
                    className="h-full rounded-full transition-[width] duration-500 ease-out"
                    style={{
                      width: `${pct}%`,
                      background: colorFor(entry.key),
                    }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
