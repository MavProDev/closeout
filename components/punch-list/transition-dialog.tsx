"use client"

import { ChevronRight, Loader2, ShieldCheck, Undo2 } from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import { PhotoUploader } from "@/components/punch-list/photo-uploader"
import { StatusPill } from "@/components/punch-list/status-pill"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { transitionStatus } from "@/lib/actions/items"
import {
  STATUS_DESCRIPTIONS,
  STATUS_LABELS,
  SUCCESS_TOASTS,
  TRANSITION_DIALOG,
} from "@/lib/copy"
import {
  type ItemStatus,
  nextStatuses,
  requiresAssignee,
  requiresCompletionPhoto,
} from "@/lib/state"
import { cn } from "@/lib/utils"

interface TransitionDialogProps {
  itemId: string
  currentStatus: ItemStatus
  hasAssignee: boolean
  /**
   * Render-prop trigger. Parent supplies the visual element (usually
   * the StatusPill) and wires up `open` as its onClick. Keeps the
   * dialog decoupled from the shape of its trigger.
   */
  children: (open: () => void) => React.ReactNode
}

type Step =
  | { kind: "pick" }
  | {
      kind: "confirm"
      to: ItemStatus
      needsPhoto: boolean
      needsAssignee: boolean
    }

/**
 * The wow component. Click a status pill, this dialog rises with a
 * fade-in-scale animation and shows only the legal next states from
 * VALID_TRANSITIONS for the current status. Special copy and gold
 * accent for the GC sign-off (complete -> verified). Photo upload
 * sub-step appears for in_progress -> complete (the gate).
 */
export function TransitionDialog({
  itemId,
  currentStatus,
  hasAssignee,
  children,
}: TransitionDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [step, setStep] = React.useState<Step>({ kind: "pick" })
  const [photo, setPhoto] = React.useState<string | null>(null)
  const [assignee, setAssignee] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const router = useRouter()

  const candidates = nextStatuses(currentStatus)

  function reset() {
    setStep({ kind: "pick" })
    setPhoto(null)
    setAssignee("")
    setSubmitting(false)
  }

  function pick(to: ItemStatus) {
    const needsPhoto = requiresCompletionPhoto(currentStatus, to)
    const needsAssignee = requiresAssignee(to) && !hasAssignee
    // Reopen paths (* -> in_progress from a non-open state, or
    // verified -> in_progress) always show a confirm step so the user
    // sees the audit-trail copy before timestamps clear.
    const isReopen =
      to === "in_progress" && currentStatus !== "open"
    if (!needsPhoto && !needsAssignee && !isReopen) {
      void submit(to, null, null)
      return
    }
    setStep({ kind: "confirm", to, needsPhoto, needsAssignee })
  }

  async function submit(
    to: ItemStatus,
    completionPhoto: string | null,
    assignedTo: string | null,
  ) {
    setSubmitting(true)
    const result = await transitionStatus({
      itemId,
      fromStatus: currentStatus,
      toStatus: to,
      completionPhoto: completionPhoto ?? undefined,
      assignedTo: assignedTo ?? undefined,
    })
    setSubmitting(false)

    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success(SUCCESS_TOASTS.itemTransitioned(to))
    setOpen(false)
    reset()
    router.refresh()
  }

  return (
    <>
      {children(() => setOpen(true))}
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v)
          if (!v) reset()
        }}
      >
        <DialogContent className="sm:max-w-md">
          {step.kind === "pick" ? (
            <PickStep
              currentStatus={currentStatus}
              candidates={candidates}
              onPick={pick}
              onClose={() => setOpen(false)}
            />
          ) : (
            <ConfirmStep
              currentStatus={currentStatus}
              to={step.to}
              needsPhoto={step.needsPhoto}
              needsAssignee={step.needsAssignee}
              photo={photo}
              assignee={assignee}
              submitting={submitting}
              onPhoto={setPhoto}
              onAssignee={setAssignee}
              onBack={() => reset()}
              onConfirm={() =>
                submit(step.to, photo ?? null, assignee || null)
              }
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

// ---------------------------------------------------------------- pick

function PickStep({
  currentStatus,
  candidates,
  onPick,
  onClose,
}: {
  currentStatus: ItemStatus
  candidates: readonly ItemStatus[]
  onPick: (to: ItemStatus) => void
  onClose: () => void
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Change status</DialogTitle>
        <DialogDescription>
          Currently <strong className="text-foreground">{STATUS_LABELS[currentStatus]}</strong>.
          Pick the next state.
        </DialogDescription>
      </DialogHeader>
      <ul className="space-y-2 py-2">
        {candidates.map((to) => {
          const isSignoff = currentStatus === "complete" && to === "verified"
          const isReopen = to === "in_progress" && currentStatus !== "open"
          return (
            <li key={to}>
              <button
                type="button"
                onClick={() => onPick(to)}
                className={cn(
                  "group flex w-full items-center justify-between gap-3 rounded-md border border-border bg-secondary/40 p-3 text-left transition-colors hover:border-primary/50 hover:bg-secondary",
                  isSignoff &&
                    "border-[var(--color-gold)]/30 bg-[color-mix(in_oklab,var(--color-gold)_8%,var(--color-secondary))] hover:border-[var(--color-gold)]",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {isSignoff && (
                      <ShieldCheck
                        className="h-4 w-4 shrink-0"
                        style={{ color: "var(--color-gold)" }}
                      />
                    )}
                    {isReopen && (
                      <Undo2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <StatusPill status={to} size="sm" />
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {isSignoff
                      ? TRANSITION_DIALOG.toVerified.description
                      : isReopen
                        ? TRANSITION_DIALOG.reopen.description
                        : STATUS_DESCRIPTIONS[to]}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </button>
            </li>
          )
        })}
      </ul>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </DialogFooter>
    </>
  )
}

// ---------------------------------------------------------------- confirm

function ConfirmStep({
  currentStatus,
  to,
  needsPhoto,
  needsAssignee,
  photo,
  assignee,
  submitting,
  onPhoto,
  onAssignee,
  onBack,
  onConfirm,
}: {
  currentStatus: ItemStatus
  to: ItemStatus
  needsPhoto: boolean
  needsAssignee: boolean
  photo: string | null
  assignee: string
  submitting: boolean
  onPhoto: (url: string | null) => void
  onAssignee: (name: string) => void
  onBack: () => void
  onConfirm: () => void
}) {
  const isSignoff = currentStatus === "complete" && to === "verified"
  const blocked =
    (needsPhoto && !photo) ||
    (needsAssignee && assignee.trim().length === 0)

  if (isSignoff) {
    return (
      <>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck
              className="h-5 w-5"
              style={{ color: "var(--color-gold)" }}
            />
            {TRANSITION_DIALOG.toVerified.title}
          </DialogTitle>
          <DialogDescription>
            {TRANSITION_DIALOG.toVerified.description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onBack} disabled={submitting}>
            {TRANSITION_DIALOG.toVerified.cancel}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={submitting || blocked}
            style={{
              background: "var(--color-gold)",
              color: "var(--color-gold-foreground)",
            }}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {TRANSITION_DIALOG.toVerified.confirm}
          </Button>
        </DialogFooter>
      </>
    )
  }

  if (needsPhoto) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>{TRANSITION_DIALOG.toComplete.title}</DialogTitle>
          <DialogDescription>
            {TRANSITION_DIALOG.toComplete.description}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <PhotoUploader
            name="completion_photo_inline"
            label={TRANSITION_DIALOG.toComplete.photoLabel}
            helpText={TRANSITION_DIALOG.toComplete.photoHelp}
            required
            initialUrl={photo}
            onUploaded={onPhoto}
          />
          {needsAssignee && (
            <AssigneeField value={assignee} onChange={onAssignee} />
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onBack} disabled={submitting}>
            Back
          </Button>
          <Button onClick={onConfirm} disabled={submitting || blocked}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {TRANSITION_DIALOG.toComplete.confirm}
          </Button>
        </DialogFooter>
      </>
    )
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{TRANSITION_DIALOG.generic.title(to)}</DialogTitle>
        <DialogDescription>
          {TRANSITION_DIALOG.generic.description(currentStatus, to)}
        </DialogDescription>
      </DialogHeader>
      {needsAssignee && (
        <div className="py-2">
          <AssigneeField value={assignee} onChange={onAssignee} />
        </div>
      )}
      <DialogFooter className="gap-2">
        <Button variant="ghost" onClick={onBack} disabled={submitting}>
          Back
        </Button>
        <Button onClick={onConfirm} disabled={submitting || blocked}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {TRANSITION_DIALOG.generic.confirm}
        </Button>
      </DialogFooter>
    </>
  )
}

function AssigneeField({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="inline-assignee">Assignee</Label>
      <Input
        id="inline-assignee"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={120}
        placeholder="Worker name"
        autoComplete="off"
      />
      <p className="text-xs text-muted-foreground">
        Required when moving an item out of Open.
      </p>
    </div>
  )
}
