"use client"

import { useEffect } from "react"

import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the real error server-side. Don't echo error.message into
    // the user-facing UI — Prisma/Supabase/runtime messages can leak
    // schema details, paths, or upstream API bodies.
    console.error("global error", { digest: error.digest })
  }, [error])

  return (
    <main className="mx-auto max-w-2xl px-6 py-20 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Something broke
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        Unexpected error.
      </h1>
      <p className="mt-3 text-muted-foreground">
        Something went wrong on the server. Try again, or refresh the
        page.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          Ref: {error.digest}
        </p>
      )}
      <div className="mt-6 flex justify-center gap-2">
        <Button onClick={reset}>Try again</Button>
      </div>
    </main>
  )
}
