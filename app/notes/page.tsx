import { CheckCircle2, GitCommit, MinusCircle, Network, ShieldCheck } from "lucide-react"
import Link from "next/link"

import { META } from "@/lib/copy"

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: META.notes.title,
  description: META.notes.description,
}

const CUTS: { name: string; reason: string }[] = [
  {
    name: "Framer Motion",
    reason:
      "Native CSS transitions and the View Transitions API cover every animation in this app. ~30 KB of bundle saved. If we ever need orchestrated multi-element timelines, motion goes back in.",
  },
  {
    name: "Recharts (or any chart library)",
    reason:
      "Four breakdown views, all proportional bars. Pure CSS divs with width transitions render faster, look identical, and add zero dependencies.",
  },
  {
    name: "react-hook-form",
    reason:
      "Native HTML forms + Server Actions + Zod give type-safe validation and progressive enhancement out of the box. No client state library required.",
  },
  {
    name: "Vercel Blob",
    reason:
      "RestoreFast's stack is Supabase. Photos go to Supabase Storage so the entire data plane lives in one provider — fewer secrets, simpler RLS story.",
  },
  {
    name: "Neon Postgres",
    reason:
      "Same reason. Supabase's Postgres + connection pooler is the contract. Adding Neon would have meant operating two database providers.",
  },
  {
    name: "An auth library (NextAuth / Clerk / etc.)",
    reason:
      "V1 is single-tenant demo. Supabase RLS policies are configured anyway, so plugging in real auth is a one-day job: scope each policy to auth.uid() and add a sign-in route.",
  },
  {
    name: "Custom illustrations for empty states",
    reason:
      "Plain text + clear CTA outperformed every illustration prototype. Foremen want functional, not Pinterest.",
  },
]

const DEFERRED: { name: string; why: string }[] = [
  {
    name: "Worker as a real table with FK on assignedTo",
    why: "Currently a denormalized string. Easy upgrade: extract Worker, migrate, change UI to autocomplete from the table.",
  },
  {
    name: "Trigger.dev background job to flag stale items",
    why: "Punch items past their due date should auto-flag for foreman attention. RestoreFast's stack already includes Trigger.dev — natural V2.",
  },
  {
    name: "Plan markup overlay (drop pins on a floor plan)",
    why: "The gold-standard punch list UX. Out of scope for the take-home but the obvious next-feature.",
  },
  {
    name: "Real-time sync via Supabase Realtime",
    why: "Multi-foreman collaboration. RLS + Realtime channels per project are 50 lines.",
  },
  {
    name: "Rate limiting on item creation and photo upload",
    why: "Production-only concern. Upstash Redis on the Edge is the standard answer when this app is multi-tenant.",
  },
  {
    name: "tRPC for the API layer",
    why: "Server Actions are the right answer at this size. tRPC earns its keep when the API surface gets large enough that an RPC contract pays for itself.",
  },
]

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

export default function BuildNotesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
        Transparency page
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        Build notes
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Every shipped product trades velocity against scope. Below is
        the honest list of what survived, what got cut, and where the
        AI tried to drift before a human caught it. RestoreFast asked
        what we traded for shipping speed; this is the answer.
      </p>

      <Section title="The four-state insight" icon={<ShieldCheck className="h-4 w-4" />}>
        <p>
          The schema RestoreFast supplied has a workflow constraint hiding in plain sight.
          {" "}<code className="rounded bg-secondary px-1.5 py-0.5 text-[0.85em]">open / in_progress / complete</code>{" "}
          is not enough states for a real construction punch list. The industry uses four. The fourth is{" "}
          <strong className="text-foreground">verified</strong>: the GC or owner sign-off after physical reinspection. Without it, a worker can mark their own work complete with no proof.
        </p>
        <p>
          The completion photo is gated on{" "}
          <code className="rounded bg-secondary px-1.5 py-0.5 text-[0.85em]">in_progress → complete</code>{" "}
          (the worker proves the fix), not on the verified transition (different actor, no new photo).
          Reopen path is wired so a rejected verified item flows back to in_progress with timestamps cleared.
        </p>
      </Section>

      <Section
        title="Pattern: the abstraction underneath"
        icon={<Network className="h-4 w-4" />}
      >
        <p>
          The punch list workflow is the same finite state machine as a
          project intake QA flow with photo gating. Same shape, different
          surface. Both are linear progressions through {" "}
          <code className="rounded bg-secondary px-1.5 py-0.5 text-[0.85em]">
            open → in_progress → complete → verified
          </code>{" "}
          with a photo-evidence gate at the worker-to-reviewer handoff and a
          reopen path when the reviewer rejects.
        </p>
        <p>
          Once you see this shape, three feature tickets collapse into one
          piece of code:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="text-foreground">Punch list items</strong>{" "}
            (this app) — defect → fix → completion photo → GC sign-off.
          </li>
          <li>
            <strong className="text-foreground">Project intake QA</strong> —
            scope draft → field walk → photo verification → PM sign-off.
          </li>
          <li>
            <strong className="text-foreground">Change-order approvals</strong>{" "}
            — request → estimate → cost-impact photo → owner sign-off.
          </li>
        </ul>
        <p>
          That&apos;s why{" "}
          <code className="rounded bg-secondary px-1.5 py-0.5 text-[0.85em]">
            lib/state.ts
          </code>{" "}
          is a pure-functions module with no React, no Prisma, no I/O — it
          can be reused by any of those flows verbatim. Adding a state, a
          transition, or a gate is a one-line edit in one file. Validators,
          UI copy, and pill colors derive from it. That&apos;s the
          abstraction worth pulling out before building both apps; it
          eliminates three future tickets and prevents the eventual drift
          where two state machines diverge slightly and become impossible
          to reconcile.
        </p>
      </Section>

      <Section title="What's in V1" icon={<CheckCircle2 className="h-4 w-4" />}>
        <ul className="list-disc space-y-1 pl-5">
          <li>Next.js 16 App Router on Vercel, React 19, TypeScript strict</li>
          <li>Supabase Postgres via Prisma 6 with the four-state extension and three indexes</li>
          <li>Server Actions with Zod validation and optimistic concurrency on every transition</li>
          <li>Supabase Storage for photos, signed upload URLs, HEIC → JPEG client-side conversion, 1600 px max edge compression</li>
          <li>shadcn/ui on Tailwind v4, custom construction-utilitarian palette, View Transitions API</li>
          <li>Mobile-first PWA shell with manifest, theme-color, 44 px tap targets</li>
          <li>Supabase RLS policies configured even without auth, ready for v2 scoping</li>
          <li>29 unit tests on the state machine (every transition exhaustively covered)</li>
        </ul>
        <p className="mt-3 text-sm text-muted-foreground">
          One spec extension worth calling out:{" "}
          <code className="rounded bg-secondary px-1.5 py-0.5 text-[0.85em]">
            Project → PunchItem
          </code>{" "}
          uses <code className="rounded bg-secondary px-1.5 py-0.5 text-[0.85em]">onDelete: Cascade</code>.
          That keeps the FK clean if a project is ever hard-deleted, which the
          UI never does (items are soft-deleted, projects stay forever). The
          cascade is a safety net for direct DB cleanup, not a UI affordance.
        </p>
      </Section>

      <Section title="What we cut and why" icon={<MinusCircle className="h-4 w-4" />}>
        <ul className="space-y-3">
          {CUTS.map((c) => (
            <li key={c.name} className="surface p-3">
              <p className="font-medium">{c.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{c.reason}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="What's deliberately deferred" icon={<GitCommit className="h-4 w-4" />}>
        <ul className="space-y-3">
          {DEFERRED.map((d) => (
            <li key={d.name} className="surface p-3">
              <p className="font-medium">{d.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{d.why}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Override moments (where the human caught the AI)" icon={<ShieldCheck className="h-4 w-4" style={{ color: "var(--color-gold)" }} />}>
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
        title="Audit pass — what surfaced, what got fixed, what got documented"
        icon={<ShieldCheck className="h-4 w-4" />}
      >
        <p>
          After V1 was deployable, the codebase ran through{" "}
          <Link href="/audits" className="text-primary underline-offset-4 hover:underline">
            FORTRESS
          </Link>
          {" "}— a 7-squad adversarial audit framework I built. 80 raw findings
          across the squads collapsed to 32 unique after deduplication and
          grounding checks. Every Critical and High that wasn&apos;t a
          documented V1 cut got fixed in the same session before submission.
        </p>
        <p>
          The fixed slate covers: security headers (CSP / HSTS /
          X-Content-Type-Options / Permissions-Policy / Referrer-Policy),
          BOLA scope on every Server Action, RLS + Storage bucket policies
          committed as a Prisma migration (closing the reproducibility gap
          where they only lived in the live Supabase project), filename
          extension derived from validated MIME instead of user-supplied
          filename (closes a stored-XSS chain), photo URL host allowlist,
          unicode hygiene on free-text inputs, optimistic-concurrency
          row-lock via Postgres FOR UPDATE, env-driven canonical URL,
          Prisma log-level scrubbed of parameter values, error boundary
          and /api/upload no longer echoing internal error messages,
          singleton service-role client, dead code removed
          (`createServerSupabase`), home-page project list capped at 12
          to defend the demo against drive-by floods.
        </p>
        <p>
          The documented-but-not-fixed slate is itself signal —
          first-principles, dV/dt: V1 demo on free tier with synthetic
          data does not need rate limiting, observability, or a private
          bucket today. See the{" "}
          <strong className="text-foreground">deferred</strong> list above
          for each item with its V2 plan.
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
