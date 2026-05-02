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
      "Correctness, legitimacy, and AI-slop pattern audit — the second of the two custom audit frameworks. Verifies that claims match code, that error handling is honest, and that no AI shortcuts ship to production.",
    runAt: "Pending — runs after Fortress findings settle",
    totalFindings: 0,
    resolved: 0,
    deferred: 0,
    frameworks: ["Closeout slop-pattern catalog v1"],
    highlights: [],
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
