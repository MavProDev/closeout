"use client"

import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { assignWorker } from "@/lib/actions/items"
import { SUCCESS_TOASTS } from "@/lib/copy"

interface AssignWorkerInlineProps {
  itemId: string
  current: string | null
}

/**
 * Inline assignee editor on the item detail page. Server Action call.
 * Keeps this concern separate from `transitionStatus` so that changing
 * the assignee never accidentally trips the state machine, and so the
 * audit trail clearly shows assignment as its own event.
 */
export function AssignWorkerInline({
  itemId,
  current,
}: AssignWorkerInlineProps) {
  const [value, setValue] = React.useState(current ?? "")
  const [submitting, setSubmitting] = React.useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (value.trim().length === 0) {
      toast.error("Assignee name required.")
      return
    }
    setSubmitting(true)
    const result = await assignWorker({ itemId, assignedTo: value.trim() })
    setSubmitting(false)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success(SUCCESS_TOASTS.itemAssigned)
    router.refresh()
  }

  const isUnchanged = (current ?? "") === value.trim()

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="flex-1 space-y-1.5">
        <Label htmlFor={`assign-${itemId}`}>Assignee</Label>
        <Input
          id={`assign-${itemId}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Worker name"
          maxLength={120}
          autoComplete="off"
          disabled={submitting}
        />
      </div>
      <Button
        type="submit"
        disabled={submitting || isUnchanged}
        className="shrink-0"
      >
        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {current ? "Update" : "Assign"}
      </Button>
    </form>
  )
}
