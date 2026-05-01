"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createProject } from "@/lib/actions/projects"
import { SUCCESS_TOASTS } from "@/lib/copy"
import type { ActionResult } from "@/lib/validators"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Creating..." : "Create project"}
    </Button>
  )
}

export function CreateProjectForm() {
  const [state, formAction] = useActionState<ActionResult<{ id: string }> | null, FormData>(
    async (prev, formData) => {
      const result = await createProject(prev, formData)
      // The action redirects on success, so we only see the result here on error.
      if (!result.ok) {
        toast.error(result.error)
      } else {
        toast.success(SUCCESS_TOASTS.projectCreated)
      }
      return result
    },
    null,
  )

  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Project name</Label>
        <Input
          id="name"
          name="name"
          required
          maxLength={200}
          autoComplete="off"
          placeholder="South Wing Renovation"
          aria-invalid={Boolean(fieldErrors?.name)}
          aria-describedby={fieldErrors?.name ? "name-error" : undefined}
        />
        {fieldErrors?.name && (
          <p id="name-error" className="text-sm text-destructive">
            {fieldErrors.name[0]}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Site address</Label>
        <Input
          id="address"
          name="address"
          required
          maxLength={500}
          autoComplete="off"
          placeholder="831 Bottom Feeder Lane, Bikini Bottom"
          aria-invalid={Boolean(fieldErrors?.address)}
          aria-describedby={fieldErrors?.address ? "address-error" : undefined}
        />
        {fieldErrors?.address && (
          <p id="address-error" className="text-sm text-destructive">
            {fieldErrors.address[0]}
          </p>
        )}
      </div>
      <SubmitButton />
    </form>
  )
}
