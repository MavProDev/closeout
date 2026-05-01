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
  frameworks: string[]
  findings: AuditFinding[]
}

// Audit data is updated by the deploy pipeline after running the
// /fortress and /slopcheck skills. Numbers below reflect the most
// recent run. See `audit-results/` in the repo for raw artifacts.

const RUNS: AuditRun[] = [
  {
    name: "Fortress",
    description:
      "Adversarial security audit, 446 personas across 25 squads through 9 phases. Every finding requires proof-of-exploit and is mapped to multiple defense-grade standards.",
    runAt: "Pending — runs at deploy time",
    totalFindings: 0,
    resolved: 0,
    frameworks: [
      "NIST 800-53",
      "NIST SSDF",
      "MITRE ATT&CK",
      "MITRE ATLAS",
      "OWASP Web Top 10",
      "OWASP LLM Top 10",
      "OWASP Agentic Top 10",
      "CWE",
      "CVSS 4.0",
      "DISA STIG",
      "AIVSS",
      "EU AI Act",
    ],
    findings: [],
  },
  {
    name: "Slopcheck",
    description:
      "Correctness, legitimacy, and AI-slop pattern audit. Verifies the code does what it claims, every claim has evidence, and there are no smell-of-AI shortcuts (TODOs, fake error handling, simulated success).",
    runAt: "Pending — runs at deploy time",
    totalFindings: 0,
    resolved: 0,
    frameworks: ["Closeout slop-pattern catalog v1"],
    findings: [],
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
        Continuous adversarial audit
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        Audits
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Every deploy of this app runs through two custom audit
        frameworks: <strong className="text-foreground">Fortress</strong>{" "}
        for security and{" "}
        <strong className="text-foreground">Slopcheck</strong> for
        correctness and AI-slop detection. Findings are mapped to
        defense-grade standards. The latest run summaries are below.
      </p>

      {RUNS.map((run) => (
        <section key={run.name} className="surface mt-6 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                <span className="grid h-6 w-6 place-items-center rounded-md bg-secondary">
                  {run.totalFindings === run.resolved ? (
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
              label="Resolved"
              value={`${run.resolved}/${run.totalFindings}`}
            />
            <Stat
              label="Status"
              value={
                run.totalFindings === run.resolved && run.totalFindings > 0
                  ? "Clean"
                  : run.totalFindings === 0
                    ? "Pending"
                    : "Open"
              }
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

          {run.findings.length > 0 && (
            <ul className="mt-4 space-y-2">
              {run.findings.map((f, i) => {
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
                        Resolved: {f.resolution}
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
        Both Fortress and Slopcheck are open-source frameworks built by
        the same engineer who built this app — so the auditor and the
        author are the same person, but the artifacts speak for
        themselves: every finding includes proof-of-exploit, not just a
        category label.
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
