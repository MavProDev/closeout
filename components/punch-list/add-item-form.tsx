"use client"

import { useRouter } from "next/navigation"
import { useActionState, useEffect } from "react"
import { useFormStatus } from "react-dom"
import { toast } from "sonner"

import { PhotoUploader } from "@/components/punch-list/photo-uploader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createItem } from "@/lib/actions/items"
import { PRIORITY_LABELS, SUCCESS_TOASTS } from "@/lib/copy"
import { ITEM_PRIORITIES } from "@/lib/state"
import type { ActionResult } from "@/lib/validators"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Add item"}
    </Button>
  )
}

interface AddItemFormProps {
  projectId: string
  onCreated?: () => void
}

export function AddItemForm({ projectId, onCreated }: AddItemFormProps) {
  const router = useRouter()
  const [state, formAction] = useActionState<
    ActionResult<{ id: string }> | null,
    FormData
  >(async (prev, formData) => {
    const result = await createItem(prev, formData)
    if (!result.ok) {
      toast.error(result.error)
    } else {
      toast.success(SUCCESS_TOASTS.itemCreated)
    }
    return result
  }, null)

  useEffect(() => {
    if (state?.ok) {
      onCreated?.()
      router.push(`/projects/${projectId}`)
      router.refresh()
    }
  }, [state, onCreated, projectId, router])

  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="projectId" value={projectId} />

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          name="location"
          required
          maxLength={200}
          placeholder="Unit 204 — Kitchen"
          autoComplete="off"
        />
        {fieldErrors?.location && (
          <p className="text-sm text-destructive">{fieldErrors.location?.[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Defect description</Label>
        <Textarea
          id="description"
          name="description"
          required
          rows={4}
          maxLength={2000}
          placeholder="Drywall patch needed behind door, paper torn"
        />
        {fieldErrors?.description && (
          <p className="text-sm text-destructive">
            {fieldErrors.description?.[0]}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select name="priority" defaultValue="normal">
            <SelectTrigger id="priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ITEM_PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="assignedTo">Assignee (optional)</Label>
          <Input
            id="assignedTo"
            name="assignedTo"
            maxLength={120}
            placeholder="Worker name"
            autoComplete="off"
          />
        </div>
      </div>

      <PhotoUploader
        name="photo"
        label="Defect photo (optional)"
        helpText="A photo of the defect, taken when it's identified."
      />

      <div className="flex flex-col gap-2 pt-2 sm:flex-row-reverse sm:justify-start">
        <SubmitButton />
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
