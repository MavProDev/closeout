import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function ProjectNotFound() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-20 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        404
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        Project not found.
      </h1>
      <p className="mt-3 text-muted-foreground">
        It might have been removed, or the link could be stale.
      </p>
      <div className="mt-6 flex justify-center">
        <Button asChild>
          <Link href="/">Back to projects</Link>
        </Button>
      </div>
    </main>
  )
}
