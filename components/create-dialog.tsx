"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import type { CreateState } from "@/app/dashboard/actions"

interface CreateDialogProps {
  title: string
  description: string
  action: (prevState: CreateState, formData: FormData) => Promise<CreateState>
  /** Extra hidden fields to include in the form */
  hiddenFields?: Record<string, string | number>
  /** Extra visible fields after the name */
  extraFields?: React.ReactNode
  triggerLabel: string
  submitLabel?: string
  /** Custom trigger element — overrides the default outline button */
  trigger?: React.ReactNode
}

export function CreateDialog({
  title,
  description,
  action,
  hiddenFields,
  extraFields,
  triggerLabel,
  submitLabel = "Create",
  trigger,
}: CreateDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [state, formAction, isPending] = React.useActionState(action, null)

  React.useEffect(() => {
    if (state?.success) setOpen(false)
  }, [state?.success])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline">
            <Plus className="size-4" />
            {triggerLabel}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form action={formAction}>
          {hiddenFields &&
            Object.entries(hiddenFields).map(([key, value]) => (
              <input key={key} type="hidden" name={key} value={String(value)} />
            ))}

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                id="name"
                name="name"
                placeholder="e.g. My home"
                required
              />
            </Field>

            {extraFields}

            {state?.error && <FieldError>{state.error}</FieldError>}
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating…" : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
