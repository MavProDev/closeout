import { cn } from "@/lib/utils"

interface CompletionRingProps {
  pct: number
  size?: number
  strokeWidth?: number
  label?: string
  className?: string
}

/**
 * Animated completion ring. Pure SVG, no chart library. Stroke-dashoffset
 * transition gives a satisfying "fill in" on initial render and on
 * status changes. Color shifts to the verified-green on 100% — which
 * happens when every non-deleted item is GC-signed-off.
 */
export function CompletionRing({
  pct,
  size = 96,
  strokeWidth = 8,
  label,
  className,
}: CompletionRingProps) {
  const safe = Math.max(0, Math.min(100, pct))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (safe / 100) * circumference
  const isComplete = safe >= 100

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        className,
      )}
      role="img"
      aria-label={`${safe} percent verified${label ? `, ${label}` : ""}`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={
            isComplete ? "var(--color-status-verified)" : "var(--color-primary)"
          }
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition:
              "stroke-dashoffset 600ms cubic-bezier(0.16, 1, 0.3, 1), stroke 300ms ease",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold tabular-nums leading-none">
          {safe}%
        </span>
        {label && (
          <span className="mt-0.5 text-[0.6rem] uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
        )}
      </div>
    </div>
  )
}
