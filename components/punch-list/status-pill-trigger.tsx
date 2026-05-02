"use client"

import { StatusPill } from "@/components/punch-list/status-pill"
import { TransitionDialog } from "@/components/punch-list/transition-dialog"
import type { ItemStatus } from "@/lib/state"

interface StatusPillTriggerProps {
  projectId: string
  itemId: string
  status: ItemStatus
  hasAssignee: boolean
  size?: "sm" | "md"
}

export function StatusPillTrigger({
  projectId,
  itemId,
  status,
  hasAssignee,
  size = "md",
}: StatusPillTriggerProps) {
  return (
    <TransitionDialog
      projectId={projectId}
      itemId={itemId}
      currentStatus={status}
      hasAssignee={hasAssignee}
    >
      {(open) => (
        <StatusPill
          status={status}
          interactive
          size={size}
          onClick={open}
        />
      )}
    </TransitionDialog>
  )
}
