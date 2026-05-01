import Link from "next/link"

import { Button } from "@/components/ui/button"
import { EMPTY_STATES } from "@/lib/copy"

export default function NotFound() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-20 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        404
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        {EMPTY_STATES.notFound}
      </h1>
      <p className="mt-3 text-muted-foreground">
        Whatever you were looking for has drifted. Try the project list.
      </p>
      <div className="mt-6 flex justify-center">
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </main>
  )
}
