import { CheckCircle2, ShieldAlert, ShieldCheck } from "lucide-react"

import { META } from "@/lib/copy"
import { cn } from "@/lib/utils"

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: META.audits.title,
  description: META.audits.description,
}

interface AuditFinding {
  severity: "info" | "low" | "medium" | "high" | "critical"
  title: string
  detail: string
  resolution?: string
}

interface AuditRun {
  name: string
  description: string
  runAt: string
  totalFindings: number
  resolved: number
  deferred: number
  frameworks: string[]
  highlights: AuditFinding[]
}

// Audit data from FORTRESS run on 2026-05-01.
// 7 squads dispatched against the codebase; 80 raw findings
// collapsed to 32 unique after grounding + dedup. Every High that
// was not a documented V1 cut was fixed in the same session before
// submission. See /notes for the deferred slate and rationale.
//
// 2026-05-02: a follow-up Fortress + Slopcheck delta pass was run
// after a lean-change commit (broaden positioning, add Westgate
// Tower demo, lift Overrides to its own page, fix RSC-boundary 500
// on item detail). Results appended below.

const RUNS: AuditRun[] = [
  {
    name: "Fortress",
    description:
      "Adversarial security audit, 7 squads (Web/API · Data · Edge Cases · Cloud · Code Quality + Vibecoder · Infrastructure · Wildcard) deployed against this codebase. Every finding required proof-of-exploit. Findings mapped to standards.",
    runAt: "2026-05-01 (pre-submission)",
    totalFindings: 32,
    resolved: 22,
    deferred: 10,
    frameworks: [
      "NIST 800-53",
      "NIST SSDF",
      "MITRE ATT&CK",
      "OWASP Web Top 10",
      "CWE",
      "CVSS 4.0",
      "DISA STIG",
    ],
    highlights: [
      {
        severity: "high",
        title: "RLS + Storage bucket policies were not in committed migrations",
        detail:
          "Originally applied via Supabase Management API at provisioning time. Closed by committing migration 20260501170000_rls_and_storage_policies — idempotent SQL that re-applies cleanly to either the live project or any fresh provision.",
        resolution:
          "Fixed — RLS, storage bucket constraints (public-read, 10MB cap, MIME whitelist), storage RLS policies, and Project.status CHECK constraint all committed.",
      },
      {
        severity: "high",
        title:
          "Stored XSS chain via filename extension trust on /api/upload",
        detail:
          "Storage path was derived from user-supplied filename. Combined with bucket policies missing from migrations (above), a fresh provision was vulnerable to claiming mime=image/jpeg + filename=evil.html to land arbitrary HTML in the public bucket.",
        resolution:
          "Fixed — extension now derived from the validated MIME type (image/jpeg → .jpg, etc.). User filename is ignored for path construction.",
      },
      {
        severity: "high",
        title:
          "BOLA / IDOR — Server Actions accepted itemId without project scope",
        detail:
          "transitionStatus, assignWorker, softDeleteItem operated on whatever item matched, with no projectId verification. UUIDs are unguessable but enumerable on the public site.",
        resolution:
          "Fixed — all four mutating actions now require projectId in their input schema and scope every WHERE clause to (id, projectId). Forged-cross-project itemIds are rejected.",
      },
      {
        severity: "high",
        title:
          "No security response headers (CSP / HSTS / X-Frame-Options / Referrer-Policy / Permissions-Policy)",
        detail:
          "Default Next.js headers provide minimal defense-in-depth; no CSP meant any future HTML injection was unmitigated.",
        resolution:
          "Fixed — next.config.ts now emits a strict CSP, X-Content-Type-Options nosniff, HSTS preload, Referrer-Policy strict-origin-when-cross-origin, and a Permissions-Policy that restricts camera/microphone/geolocation.",
      },
      {
        severity: "high",
        title: "next/image hostname wildcard `*.supabase.co` too broad",
        detail:
          "Allowed proxying any Supabase tenant's bucket through the closeout origin — cost amplification + cache poisoning vector.",
        resolution:
          "Fixed — pinned to the configured project hostname only, derived from NEXT_PUBLIC_SUPABASE_URL at build time.",
      },
      {
        severity: "medium",
        title:
          "Optimistic-concurrency had a TOCTOU window when a transition also reassigned the worker",
        detail:
          "transitionStatus read existing.assignedTo, then UPDATE'd. A concurrent assignWorker landing in between could be silently overwritten.",
        resolution:
          "Fixed — read + update now run inside prisma.$transaction with SELECT ... FOR UPDATE on the row.",
      },
      {
        severity: "medium",
        title:
          "softDeleteItem and assignWorker did not filter `deletedAt: null`",
        detail:
          "Soft-deleted items could be re-deleted (overwriting deletion timestamp) or reassigned (mutating audit-trail rows post-deletion).",
        resolution:
          "Fixed — both actions now use updateMany with deletedAt:null in WHERE and reject with count===0.",
      },
      {
        severity: "medium",
        title: "Photo URL field accepted any host",
        detail:
          "z.string().url() with no allowlist. Audit-trail records could be polluted with attacker-controlled URLs (tracker pixels, foreign hosts).",
        resolution:
          "Fixed — Zod refinement enforces https + the configured Supabase Storage host + the /storage/v1/object/public/ path prefix.",
      },
      {
        severity: "medium",
        title:
          "Error boundary and /api/upload echoed `error.message` to clients",
        detail:
          "Prisma/Supabase/runtime error text could fingerprint backend services and reveal internal config to an unauthenticated probe.",
        resolution:
          "Fixed — error.tsx renders only a constant message + opaque digest. /api/upload returns a constant message and logs the real error server-side.",
      },
      {
        severity: "medium",
        title:
          "vercel-build ran prisma migrate deploy on every preview deploy",
        detail:
          "Vercel-Supabase Marketplace shares the project across environments; a feature-branch migration could ship to prod before review.",
        resolution:
          "Fixed — vercel-build now skips migrate; a separate vercel-build-with-migrate script is reserved for explicit post-merge runs. Migrations are idempotent so re-application is safe.",
      },
      {
        severity: "low",
        title:
          "trimmedNonEmpty allowed null bytes, control chars, RTL override, zero-width unicode",
        detail:
          "Free-text fields could be polluted with display-spoofing characters that render invisibly or flip text direction in audit-trail exports.",
        resolution:
          "Fixed — Zod schema now NFC-normalizes and rejects forbidden char classes.",
      },
      {
        severity: "low",
        title:
          "Prisma `query` log level in dev included parameter values (PII risk)",
        detail:
          "Worker names and free-text descriptions appeared in dev terminal — leak surface for screenshots, screen-shares, and CI logs.",
        resolution:
          "Fixed — dev log level reduced to warn+error; query-level logs disabled.",
      },
      {
        severity: "info",
        title:
          "10 lower-severity items deliberately deferred to V2 with documented rationale",
        detail:
          "Rate limiting, private bucket + signed read URLs, observability/Sentry, CI workflow, heic2any replacement, et al. — see /notes for each item with its first-principles reasoning.",
      },
    ],
  },
  {
    name: "Slopcheck",
    description:
      "Correctness, legitimacy, and AI-slop pattern audit. Hunts claims-vs-reality drift, fabricated APIs, tautological tests, redundant defensive checks, comment-vs-code mismatches, and presentation-polish gaps. Single auditor squad ran the 25-pattern catalog plus the master 158-item checklist.",
    runAt: "2026-05-01 (post-Fortress)",
    totalFindings: 6,
    resolved: 6,
    deferred: 0,
    frameworks: ["Closeout slop-pattern catalog v1"],
    highlights: [
      {
        severity: "medium",
        title:
          "Tautological tests in the state machine (mirror their own implementation)",
        detail:
          "Two test blocks asserted nextStatuses(from) toEqual VALID_TRANSITIONS[from], and canTransition iterated VALID_TRANSITIONS[from] then asserted true — both tautological since the implementation IS those data structures.",
        resolution:
          "Fixed — replaced with hardcoded spec literals. If lib/state.ts is changed, the tests now fail loudly instead of passing silently.",
      },
      {
        severity: "medium",
        title:
          "Redundant defensive guard in lib/blob.ts — both ALLOWED_MIME and MIME_TO_EXT keyed on identical values",
        detail:
          "createPhotoUpload checked ALLOWED_MIME.has(mime) and then if (!ext) on the lookup result. The second branch was unreachable.",
        resolution:
          "Fixed — ALLOWED_MIME now derived from Object.keys(MIME_TO_EXT), single source of truth, no drift possible.",
      },
      {
        severity: "low",
        title:
          "README optimistic-concurrency code snippet didn't match the shipped implementation",
        detail:
          "README showed the older WHERE-clause-with-assignedTo version. The actual code uses prisma.$transaction with SELECT FOR UPDATE.",
        resolution:
          "Fixed — README snippet replaced with a faithful excerpt of the transaction-based implementation.",
      },
      {
        severity: "low",
        title:
          "Off-by-two field count in README intro to schema additions",
        detail:
          "'Four field extensions' — actual count is six (PunchItem.updatedAt, completionPhoto, completedAt, verifiedAt, deletedAt + Project.updatedAt).",
        resolution:
          "Fixed — README updated to 'Six field extensions'.",
      },
      {
        severity: "low",
        title:
          "ItemPhoto helper duplicated across item card and item detail page",
        detail:
          "Two near-identical helpers, divergence-prone. Slop pattern: copy-paste drift.",
        resolution:
          "Fixed — extracted to components/punch-list/item-photo.tsx; both call sites import from it.",
      },
      {
        severity: "low",
        title:
          "Misleading `GlobalError` name on segment-level error boundary",
        detail:
          "File is app/error.tsx (per-segment boundary, per Next convention). The export was named GlobalError, which implies a global-error.tsx scope that doesn't exist in the repo.",
        resolution:
          "Fixed — renamed to RouteError with a comment explaining the scope.",
      },
    ],
  },
  {
    name: "Fortress (delta pass)",
    description:
      "Focused Fortress re-run after a lean-change commit set: positioning broadened, Westgate Tower demo added, Overrides lifted into its own top-nav page, and a Server-Component-to-Client-Component render-prop boundary fix that had landed a 500 on the item detail route. Goal: confirm the diff added no new attack surface and verify the RSC fix.",
    runAt: "2026-05-02 (post-lean-changes)",
    totalFindings: 1,
    resolved: 1,
    deferred: 0,
    frameworks: [
      "OWASP Web Top 10",
      "CWE",
      "React Server Components boundary rules",
    ],
    highlights: [
      {
        severity: "info",
        title:
          "RSC-boundary fix is the textbook minimal solution",
        detail:
          "The item detail route was returning 500 with 'Functions cannot be passed directly to Client Components'. Root cause: a Server Component was passing a render-prop function as TransitionDialog's children. Fix introduces a small \"use client\" wrapper (StatusPillTrigger) that owns the render-prop on the client side. Server Component now passes only serializable primitives. ItemCard (already \"use client\") was unaffected and keeps the existing TransitionDialog render-prop API.",
        resolution:
          "Fixed — wrapper added, route resolves 200, no new attack surface.",
      },
      {
        severity: "low",
        title:
          "Seed had a redundant deleteMany already covered by onDelete: Cascade",
        detail:
          "The wipe-and-reseed loop called prisma.punchItem.deleteMany followed by prisma.project.delete. Schema already declares Project ⇢ PunchItem onDelete: Cascade, so the explicit deleteMany was double-work. Dev-script polish only — no security impact.",
        resolution:
          "Fixed — deleteMany removed, comment added explaining cascade handles children.",
      },
      {
        severity: "info",
        title:
          "5 positive findings — no fix required",
        detail:
          "Overrides page is a static read-only Server Component with proper rel=noopener noreferrer on external links and no DB/env/cookie access. New copy strings are author-controlled JSX text (auto-escaped). Westgate seed strings are author-controlled. No new Server Actions or API routes added. Prop surface on the new client wrapper is only primitives + the existing ItemStatus enum.",
      },
    ],
  },
  {
    name: "Slopcheck (delta pass)",
    description:
      "Focused Slopcheck re-run on the same lean-change diff. Goal: catch any new claims-vs-code drift, fabricated technical vocabulary in the new restoration seed data, tautological copy on the Overrides page, and any AI-slop smells the lean changes might have introduced. Three real findings surfaced; six positive findings confirmed the diff was honest.",
    runAt: "2026-05-02 (post-lean-changes)",
    totalFindings: 3,
    resolved: 3,
    deferred: 0,
    frameworks: ["Closeout slop-pattern catalog v1"],
    highlights: [
      {
        severity: "low",
        title:
          "README seed-comment drift after Westgate added",
        detail:
          "README local-dev block read 'pnpm db:seed   # populate the Krusty Krab demo' but the seed now creates two projects. Same class of finding the original Slopcheck pass caught (comment vs code drift) — auditor flagged it before a reviewer would.",
        resolution:
          "Fixed — comment now reads 'populate the Krusty Krab + Westgate Tower demos'.",
      },
      {
        severity: "low",
        title:
          "Westgate items in complete/verified states had null completion photos — contradicting the photo gate",
        detail:
          "Two Westgate items (vapor barrier, exit sign) seeded as status=complete and status=verified with completionPhoto=null. The app's photo gate (lib/actions/items.ts:97 — requiresCompletionPhoto on in_progress→complete) blocks that transition without a photo, so the seed was bypassing the very rule the four-state model sells. A reviewer poking at the Westgate 'Signed off' item would have seen no proof artifact.",
        resolution:
          "Fixed — both items dropped to in_progress with descriptions amended to call out 'photograph for adjuster file before sign-off'. Westgate is now wholly mid-stream on the photo-gate side, consistent with the 'no photos bundled yet' framing.",
      },
      {
        severity: "low",
        title:
          "Logger-gap arithmetic was off by six minutes",
        detail:
          "Westgate item description claimed '14-hour gap … logger battery failed at 23:14, restored 13:08'. 23:14 → next-day 13:08 is 13h 54m. Real adjuster file notes are precise on time math; rounding casually here would read AI-generated to a careful reader.",
        resolution:
          "Fixed — restoration time shifted to 13:14, making the gap exactly 14 hours and the math honest.",
      },
      {
        severity: "info",
        title:
          "6 positive findings — restoration vocabulary, test count, abstraction claim, RSC fix, audience-tilt cleanup all verified",
        detail:
          "Restoration vocabulary (LGR dehumidifier, psychrometric log, anti-microbial chain-of-custody, vapor-barrier seam, Cat 2 water-loss framing, microbial strip-test + containment plan) is industry-correct, not hallucinated. README and /notes claim of 29 vitest tests still holds (vitest run confirms). The four-state-machine claim on /notes is supported by lib/state.ts's pure-functions design. StatusPillTrigger has no logic duplication. No stray TODO/FIXME/console-debug introduced. Take-home origin remains explicit but no specific company is named anywhere in code, copy, or docs.",
      },
    ],
  },
]

const SEVERITY_STYLE: Record<
  AuditFinding["severity"],
  { ring: string; bg: string; label: string }
> = {
  info: {
    ring: "var(--color-status-open)",
    bg: "color-mix(in oklab, var(--color-status-open) 12%, transparent)",
    label: "Info",
  },
  low: {
    ring: "var(--color-priority-low)",
    bg: "color-mix(in oklab, var(--color-priority-low) 12%, transparent)",
    label: "Low",
  },
  medium: {
    ring: "var(--color-priority-normal)",
    bg: "color-mix(in oklab, var(--color-priority-normal) 12%, transparent)",
    label: "Medium",
  },
  high: {
    ring: "var(--color-priority-high)",
    bg: "color-mix(in oklab, var(--color-priority-high) 14%, transparent)",
    label: "High",
  },
  critical: {
    ring: "var(--color-priority-critical)",
    bg: "color-mix(in oklab, var(--color-priority-critical) 14%, transparent)",
    label: "Critical",
  },
}

export default function AuditsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
        Adversarial audit, pre-submission
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        Audits
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Before this app shipped, I ran it through two custom audit
        frameworks I built:{" "}
        <strong className="text-foreground">Fortress</strong> for
        adversarial security and{" "}
        <strong className="text-foreground">Slopcheck</strong> for
        correctness and AI-slop detection. The dispassionate observation:
        running my own framework on my own work is the cheapest way to
        catch what I would otherwise miss. Findings, mappings, and the
        fixed-vs-deferred slate are below.
      </p>

      {RUNS.map((run) => (
        <section key={run.name} className="surface mt-6 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                <span className="grid h-6 w-6 place-items-center rounded-md bg-secondary">
                  {run.totalFindings === run.resolved + run.deferred &&
                  run.totalFindings > 0 ? (
                    <ShieldCheck
                      className="h-3.5 w-3.5"
                      style={{ color: "var(--color-status-verified)" }}
                    />
                  ) : (
                    <ShieldAlert
                      className="h-3.5 w-3.5"
                      style={{ color: "var(--color-priority-high)" }}
                    />
                  )}
                </span>
                {run.name}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {run.description}
              </p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p>Last run</p>
              <p className="text-foreground">{run.runAt}</p>
            </div>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Findings" value={run.totalFindings.toString()} />
            <Stat
              label="Fixed"
              value={`${run.resolved}/${run.totalFindings}`}
            />
            <Stat
              label="Deferred"
              value={`${run.deferred}/${run.totalFindings}`}
            />
            <Stat label="Frameworks" value={run.frameworks.length.toString()} />
          </dl>

          <div className="mt-4">
            <h3 className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Frameworks mapped
            </h3>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {run.frameworks.map((f) => (
                <li
                  key={f}
                  className="rounded-sm border border-border bg-secondary/40 px-2 py-0.5 text-[0.65rem] uppercase tracking-wider text-muted-foreground"
                >
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {run.highlights.length > 0 && (
            <ul className="mt-4 space-y-2">
              {run.highlights.map((f, i) => {
                const style = SEVERITY_STYLE[f.severity]
                return (
                  <li
                    key={`${f.title}-${i}`}
                    className="rounded-md border p-3"
                    style={{ background: style.bg, borderColor: style.ring }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{f.title}</p>
                      <span
                        className="rounded-sm px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider"
                        style={{ color: style.ring, borderColor: style.ring }}
                      >
                        {style.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {f.detail}
                    </p>
                    {f.resolution && (
                      <p
                        className="mt-2 inline-flex items-center gap-1.5 text-xs"
                        style={{ color: "var(--color-status-verified)" }}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        {f.resolution}
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      ))}

      <p className="mt-8 text-xs text-muted-foreground">
        Both Fortress and Slopcheck are open-source frameworks I built —
        so the auditor and the author are the same person. The artifacts
        speak for themselves: every fix is in commit history, every
        deferred item has documented reasoning on /notes, and the
        repository is public.
      </p>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={cn("surface p-3")}>
      <p className="text-[0.6rem] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  )
}
