import * as React from "react"

import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/copy"
import type { ItemPriority, ItemStatus } from "@/lib/state"
import { cn } from "@/lib/utils"

interface StatusPillProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  status: ItemStatus
  interactive?: boolean
  size?: "sm" | "md"
}

/**
 * The status pill is the primary interactive surface on every item.
 * Tap it, transition dialog opens. Color comes from data-status,
 * which the .pill rules in globals.css resolve into the four-state
 * palette via color-mix().
 */
export function StatusPill({
  status,
  interactive = false,
  size = "md",
  className,
  children,
  ...rest
}: StatusPillProps) {
  const sizeClass = size === "sm" ? "text-[0.65rem] px-2 py-0.5" : ""

  if (interactive) {
    return (
      <button
        type="button"
        data-status={status}
        aria-label={`Change status from ${STATUS_LABELS[status]}`}
        className={cn("pill", sizeClass, className)}
        {...rest}
      >
        <span
          aria-hidden
          className="inline-block h-1.5 w-1.5 rounded-full bg-current"
        />
        {children ?? STATUS_LABELS[status]}
      </button>
    )
  }

  return (
    <span
      data-status={status}
      className={cn("pill", sizeClass, className)}
    >
      <span
        aria-hidden
        className="inline-block h-1.5 w-1.5 rounded-full bg-current"
      />
      {children ?? STATUS_LABELS[status]}
    </span>
  )
}

interface PriorityPillProps {
  priority: ItemPriority
  size?: "sm" | "md"
  className?: string
}

export function PriorityPill({
  priority,
  size = "md",
  className,
}: PriorityPillProps) {
  const sizeClass = size === "sm" ? "text-[0.65rem] px-2 py-0.5" : ""
  return (
    <span
      data-priority={priority}
      className={cn("pill", sizeClass, className)}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  )
}
