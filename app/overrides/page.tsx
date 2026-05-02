import { CheckCircle2, ShieldCheck } from "lucide-react"
import Link from "next/link"

import { META } from "@/lib/copy"

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: META.overrides.title,
  description: META.overrides.description,
}

const OVERRIDES: { title: string; body: string }[] = [
  {
    title: "Stack mismatch (planning round 1)",
    body: "Claude proposed Next.js + Prisma + Neon Postgres + Vercel Blob in the first plan. Looked polished. Industry-default. The job listing names Supabase explicitly. Refactored before any code shipped. Lesson: AI produces confident output without verifying full context.",
  },
  {
    title: "Photo gate on the wrong transition (planning round 2)",
    body: "Claude initially gated the completion-photo requirement on complete → verified. Wrong actor. The worker uploads proof when they finish the work (in_progress → complete); the GC sign-off (complete → verified) is a separate inspection with no new photo. Caught on a forced logic audit. Lesson: confident-sounding state machines still need actor-by-actor review.",
  },
  {
    title: "Stale runtime pin (this build)",
    body: "Plan locked .nvmrc to Node 20. Today is April 2026. Node 20 (Iron) hit EOL this month. Caught it before scaffolding, bumped to Node 22 (Jod LTS). Lesson: plans go stale; pin against drift only when you re-verify the rationale.",
  },
  {
    title: "Stale framework pin (this build)",
    body: "Same plan locked Tailwind v3 for shadcn compatibility. shadcn shipped full Tailwind v4 support a few months back. Asked for an explicit override and went with current Next 16 + Tailwind v4. Lesson: pin to spirit (lock against drift), not to letter (a snapshot from when the plan was written).",
  },
]

export default function OverridesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
        Transparency page
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        Overrides
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        AI-assisted development is leverage, not an autopilot. Every
        AI-built submission needs a record of where the human stopped
        the AI from drifting, and where the human built something the
        AI couldn&apos;t. This page is that record.
      </p>

      <Section
        title="Override moments (where the human caught the AI)"
        icon={<ShieldCheck className="h-4 w-4" style={{ color: "var(--color-gold)" }} />}
      >
        <p className="text-sm text-muted-foreground">
          Four moments during planning and build where the AI&apos;s
          confident output was wrong, and a human review caught it
          before it shipped. The pattern in each is the same: AI
          produces fluent output that <em>looks</em> right, and only a
          re-read against the actual context (job spec, current dates,
          actor responsibilities) surfaces the drift.
        </p>
        <ol className="space-y-3">
          {OVERRIDES.map((o, i) => (
            <li key={o.title} className="surface p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                #{i + 1}
              </p>
              <p className="mt-1 font-medium">{o.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{o.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section
        title="Human signature"
        icon={<CheckCircle2 className="h-4 w-4" style={{ color: "var(--color-gold)" }} />}
      >
        <p>
          The Krusty Krab demo carries 12 punch items. Eleven are
          straight construction-defect language with the joke
          hiding in the project name and item locations. The
          twelfth is mine, by hand: an unauthorized employee-built
          structure inside the walk-in cooler, blocked egress,
          scattered product, a top-secret-labeled crate. Reads as
          a real defect on the first pass. Pays off on the second.
          Every AI-built submission needs a place where the human
          built something the AI couldn&apos;t — this is mine.
        </p>
      </Section>

      <Section
        title="Why this gets its own page"
        icon={<ShieldCheck className="h-4 w-4" />}
      >
        <p>
          {" "}
          <Link href="/notes" className="text-primary underline-offset-4 hover:underline">
            Build notes
          </Link>{" "}
          is the meta-narrative — what shipped, what got cut, why.
          {" "}
          <Link href="/audits" className="text-primary underline-offset-4 hover:underline">
            Audits
          </Link>{" "}
          is the adversarial pass — what custom audit frameworks
          surfaced and what got fixed. This page is a third question:
          where did the human override the AI, and where did the human
          add what the AI couldn&apos;t? In a market where AI-fluent
          output is cheap, the answer to that question is the
          differentiator. Burying it mid-page on Build notes
          undersold it. Front-of-house, with its own URL and nav slot,
          is honest about how the work actually happened.
        </p>
      </Section>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <p>
          Source:{" "}
          <a
            href="https://github.com/MavProDev/closeout"
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            github.com/MavProDev/closeout
          </a>
        </p>
        <Link
          href="/audits"
          className="underline-offset-4 hover:text-foreground hover:underline"
        >
          See the audit results →
        </Link>
      </div>
    </div>
  )
}

function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="mt-8">
      <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-secondary text-primary">
          {icon}
        </span>
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed">{children}</div>
    </section>
  )
}
