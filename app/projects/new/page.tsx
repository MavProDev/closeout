import Link from "next/link"

import { CreateProjectForm } from "@/components/projects/create-project-form"

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "New project",
}

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/"
        className="text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
      >
        ← Projects
      </Link>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        New project
      </h1>
      <p className="mt-2 text-muted-foreground">
        Name and address only. You&apos;ll add defects on the next page.
      </p>
      <div className="mt-6">
        <CreateProjectForm />
      </div>
    </div>
  )
}
