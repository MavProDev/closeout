"use client"

import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-20 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Something broke
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        Unexpected error.
      </h1>
      <p className="mt-3 text-muted-foreground">
        {error.message || "An unexpected error occurred."}
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          {error.digest}
        </p>
      )}
      <div className="mt-6 flex justify-center gap-2">
        <Button onClick={reset}>Try again</Button>
      </div>
    </main>
  )
}
