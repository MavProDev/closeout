import { ArrowRight, ClipboardCheck, ShieldCheck, Workflow } from "lucide-react"
import Link from "next/link"

import { ProjectCard } from "@/components/projects/project-card"
import { Button } from "@/components/ui/button"
import { APP, EMPTY_STATES, META } from "@/lib/copy"
import { listProjects } from "@/lib/dashboard"

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: META.home.title,
  description: META.home.description,
}

// Home reads the project list at request time. Prerendering would
// require the DB at build time, which we don't want.
export const dynamic = "force-dynamic"

// Cap the public project list to defend the demo against drive-by
// floods. V1 has no auth and `createProject` is unrate-limited (a
// deliberate cut); without a cap, any visitor could push the seed
// project off the page by spamming new projects. Show only the most
// recent 12 with a tail-truncation note when more exist.
const HOMEPAGE_PROJECT_CAP = 12

export default async function HomePage() {
  const all = await listProjects()
  const projects = all.slice(0, HOMEPAGE_PROJECT_CAP)
  const truncated = all.length - projects.length

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <section className="surface relative overflow-hidden p-6 sm:p-10">
        <div
          aria-hidden
          className="hatched absolute inset-0 opacity-[0.04]"
        />
        <div className="relative">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <ClipboardCheck className="h-3.5 w-3.5" />
            <span>{APP.tagline}</span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            {APP.name}, the four-state punch list.
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Defects open. Workers fix. Workers prove the fix with a
            photo. The GC signs off. Real construction and restoration
            work, real audit trail.
          </p>
          <ul className="mt-6 grid grid-cols-1 gap-3 text-sm text-muted-foreground sm:grid-cols-3">
            <li className="surface flex items-start gap-2 p-3">
              <Workflow
                className="mt-0.5 h-4 w-4 shrink-0"
                style={{ color: "var(--color-status-in_progress)" }}
              />
              <span>
                <strong className="text-foreground">Open → In progress → Complete → Verified.</strong>
                {" "}Photo gate on the third arrow. Sign-off (GC, owner, or adjuster) on the fourth.
              </span>
            </li>
            <li className="surface flex items-start gap-2 p-3">
              <ShieldCheck
                className="mt-0.5 h-4 w-4 shrink-0"
                style={{ color: "var(--color-gold)" }}
              />
              <span>
                <strong className="text-foreground">Optimistic concurrency on every transition.</strong>
                {" "}Two foremen on the same item won&apos;t race.
              </span>
            </li>
            <li className="surface flex items-start gap-2 p-3">
              <ClipboardCheck
                className="mt-0.5 h-4 w-4 shrink-0"
                style={{ color: "var(--color-status-verified)" }}
              />
              <span>
                <strong className="text-foreground">Soft-delete only.</strong>
                {" "}Construction audit trails matter.
              </span>
            </li>
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/projects/new">
                Create a project <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/notes">Read the build notes</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Projects
          </h2>
          <span className="text-xs tabular-nums text-muted-foreground">
            {projects.length} {projects.length === 1 ? "project" : "projects"}
          </span>
        </div>
        {projects.length === 0 ? (
          <div className="surface mt-3 grid place-items-center p-12 text-center text-sm text-muted-foreground">
            {EMPTY_STATES.noProjects}
          </div>
        ) : (
          <>
            <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {projects.map((p) => (
                <li key={p.id}>
                  <ProjectCard project={p} />
                </li>
              ))}
            </ul>
            {truncated > 0 && (
              <p className="mt-3 text-xs text-muted-foreground">
                +{truncated} older {truncated === 1 ? "project" : "projects"} not shown.
              </p>
            )}
          </>
        )}
      </section>
    </div>
  )
}
