// All user-facing strings. One file to sweep when copy needs revision.
//
// Why this exists: punch list copy is opinionated and load-bearing.
// "Sign off as GC or Owner" reads differently than "Approve" — the
// former signals the GC's role in the workflow, which is the whole
// point of the four-state model. Keeping copy in code-adjacent
// constants instead of buried in components makes the language an
// auditable single artifact.

import type { ItemPriority, ItemStatus } from "@/lib/state"

// Drive the canonical URL from Vercel's auto-injected env so
// preview deploys, branch deploys, and local dev all use the
// correct origin for OG metadata, manifest, and absolute links.
function resolveAppUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return "http://localhost:3000"
}

export const APP = {
  name: "Closeout",
  shortName: "Closeout",
  tagline: "Punch list tracker",
  description:
    "A punch list tracker for general contractors with the four-state model and photo-gated completion.",
  ogTitle: "Closeout, punch list tracker",
  url: resolveAppUrl(),
} as const

export const STATUS_LABELS: Record<ItemStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  complete: "Complete",
  verified: "Verified",
}

export const STATUS_DESCRIPTIONS: Record<ItemStatus, string> = {
  open: "Defect identified, not yet assigned or in progress.",
  in_progress: "Worker assigned and addressing the defect.",
  complete:
    "Worker has uploaded a completion photo. Awaiting GC sign-off.",
  verified:
    "GC or owner has signed off. Closed for retainage release.",
}

export const PRIORITY_LABELS: Record<ItemPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  critical: "Critical",
}

export const TRANSITION_DIALOG = {
  generic: {
    title: (to: ItemStatus) => `Move to ${STATUS_LABELS[to]}`,
    description: (from: ItemStatus, to: ItemStatus) =>
      `This item will move from ${STATUS_LABELS[from]} to ${STATUS_LABELS[to]}.`,
    confirm: "Confirm",
    cancel: "Cancel",
  },
  toComplete: {
    title: "Mark complete",
    description:
      "Upload a photo of the completed work. The GC or owner will inspect and sign off.",
    confirm: "Mark complete",
    photoLabel: "Completion photo",
    photoHelp:
      "A clear photo of the fix. This becomes the audit-trail evidence at sign-off.",
  },
  toVerified: {
    title: "Sign off as GC or Owner",
    description:
      "This is the final acceptance step. Once verified, this item is closed for retainage release. Reopening a verified item is possible but creates an audit-trail entry.",
    confirm: "Mark verified",
    cancel: "Cancel",
  },
  reopen: {
    title: "Reopen this item",
    description:
      "Used when a later walkthrough rejects a previously verified or completed item. Completion and verification timestamps will be cleared.",
    confirm: "Reopen",
    cancel: "Cancel",
  },
} as const

export const EMPTY_STATES = {
  noProjects:
    "No projects yet. Create your first project to start tracking defects.",
  noItems: "No items yet. Add the first defect to start tracking.",
  noItemsInTab: "No items in this state.",
  notFound: "Page not found in this Pineapple.",
} as const

export const VALIDATION_ERRORS = {
  missingPhoto:
    "A completion photo is required to mark this item complete.",
  missingAssignee:
    "Assign a worker before moving this item out of Open.",
  invalidTransition:
    "This status change isn't allowed from the current state.",
  staleState:
    "This item changed since the page loaded. Refresh and try again.",
  unknown: "Something went wrong. Try again.",
} as const

export const SUCCESS_TOASTS = {
  projectCreated: "Project created.",
  itemCreated: "Item added.",
  itemTransitioned: (to: ItemStatus) => `Moved to ${STATUS_LABELS[to]}.`,
  itemAssigned: "Worker assigned.",
  itemDeleted: "Item removed.",
} as const

export const TABS = {
  all: "All",
  open: "Open",
  in_progress: "In progress",
  complete: "Complete",
  verified: "Verified",
} as const

export const META = {
  home: {
    title: "Closeout, punch list tracker",
    description: APP.description,
  },
  notes: {
    title: "Build notes — Closeout",
    description:
      "What we shipped, what we cut, what we deferred, and the override moments where the human caught the AI.",
  },
  audits: {
    title: "Audits — Closeout",
    description:
      "Adversarial security and slop-detection audit results across NIST 800-53, MITRE ATT&CK / ATLAS, OWASP, CWE, CVSS 4.0, and DISA STIG.",
  },
} as const
