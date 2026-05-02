import { describe, expect, it } from "vitest"

import {
  ITEM_PRIORITIES,
  ITEM_STATUSES,
  PROJECT_STATUSES,
  VALID_TRANSITIONS,
  canTransition,
  computeProjectStatus,
  isItemPriority,
  isItemStatus,
  nextStatuses,
  requiresAssignee,
  requiresCompletionPhoto,
  transitionSideEffects,
} from "@/lib/state"

describe("constants", () => {
  it("ITEM_STATUSES are ordered shortest-path-first", () => {
    expect(ITEM_STATUSES).toEqual([
      "open",
      "in_progress",
      "complete",
      "verified",
    ])
  })

  it("ITEM_PRIORITIES go low to critical", () => {
    expect(ITEM_PRIORITIES).toEqual(["low", "normal", "high", "critical"])
  })

  it("PROJECT_STATUSES are computed-only", () => {
    expect(PROJECT_STATUSES).toEqual(["active", "closed"])
  })
})

describe("VALID_TRANSITIONS", () => {
  it("open -> in_progress only", () => {
    expect(VALID_TRANSITIONS.open).toEqual(["in_progress"])
  })

  it("in_progress can complete or reopen", () => {
    expect(VALID_TRANSITIONS.in_progress).toEqual(["complete", "open"])
  })

  it("complete can verify or reopen", () => {
    expect(VALID_TRANSITIONS.complete).toEqual([
      "verified",
      "in_progress",
    ])
  })

  it("verified reopens to in_progress only (the rejection path)", () => {
    expect(VALID_TRANSITIONS.verified).toEqual(["in_progress"])
  })
})

describe("canTransition", () => {
  // Hardcoded legal transitions — these assert the SPEC, not the
  // shape of VALID_TRANSITIONS. If lib/state.ts is changed to allow
  // a different transition, these tests must be updated explicitly.
  it("allows every legal transition (hardcoded spec)", () => {
    expect(canTransition("open", "in_progress")).toBe(true)
    expect(canTransition("in_progress", "complete")).toBe(true)
    expect(canTransition("in_progress", "open")).toBe(true)
    expect(canTransition("complete", "verified")).toBe(true)
    expect(canTransition("complete", "in_progress")).toBe(true)
    expect(canTransition("verified", "in_progress")).toBe(true)
  })

  it("forbids open -> complete (the spec's three-state shortcut)", () => {
    expect(canTransition("open", "complete")).toBe(false)
  })

  it("forbids open -> verified", () => {
    expect(canTransition("open", "verified")).toBe(false)
  })

  it("forbids in_progress -> verified (must pass through complete)", () => {
    expect(canTransition("in_progress", "verified")).toBe(false)
  })

  it("forbids self-transitions", () => {
    for (const s of ITEM_STATUSES) {
      expect(canTransition(s, s)).toBe(false)
    }
  })
})

describe("nextStatuses", () => {
  // Hardcoded spec — does not reference VALID_TRANSITIONS so a change
  // to the state machine fails this test instead of tautologically
  // passing.
  it("returns hardcoded expected list for each status", () => {
    expect(nextStatuses("open")).toEqual(["in_progress"])
    expect(nextStatuses("in_progress")).toEqual(["complete", "open"])
    expect(nextStatuses("complete")).toEqual(["verified", "in_progress"])
    expect(nextStatuses("verified")).toEqual(["in_progress"])
  })
})

describe("requiresCompletionPhoto", () => {
  it("only on in_progress -> complete", () => {
    expect(requiresCompletionPhoto("in_progress", "complete")).toBe(true)
  })

  it("not on complete -> verified (GC sign-off, separate actor)", () => {
    expect(requiresCompletionPhoto("complete", "verified")).toBe(false)
  })

  it("not on any reopen path", () => {
    expect(requiresCompletionPhoto("complete", "in_progress")).toBe(false)
    expect(requiresCompletionPhoto("verified", "in_progress")).toBe(false)
    expect(requiresCompletionPhoto("in_progress", "open")).toBe(false)
  })
})

describe("requiresAssignee", () => {
  it("required for in_progress, complete, verified destinations", () => {
    expect(requiresAssignee("in_progress")).toBe(true)
    expect(requiresAssignee("complete")).toBe(true)
    expect(requiresAssignee("verified")).toBe(true)
  })

  it("not required when reopening back to open", () => {
    expect(requiresAssignee("open")).toBe(false)
  })
})

describe("transitionSideEffects", () => {
  const t = new Date("2026-05-01T00:00:00Z")

  it("sets completedAt on * -> complete", () => {
    expect(transitionSideEffects("in_progress", "complete", t)).toEqual({
      completedAt: t,
    })
  })

  it("sets verifiedAt on * -> verified", () => {
    expect(transitionSideEffects("complete", "verified", t)).toEqual({
      verifiedAt: t,
    })
  })

  it("clears completedAt and verifiedAt on verified -> in_progress", () => {
    expect(transitionSideEffects("verified", "in_progress", t)).toEqual({
      verifiedAt: null,
      completedAt: null,
    })
  })

  it("clears completedAt on complete -> in_progress", () => {
    expect(transitionSideEffects("complete", "in_progress", t)).toEqual({
      completedAt: null,
    })
  })

  it("no side effects on in_progress -> open", () => {
    expect(transitionSideEffects("in_progress", "open", t)).toEqual({})
  })
})

describe("computeProjectStatus", () => {
  it("empty project is active", () => {
    expect(computeProjectStatus(0, 0)).toBe("active")
  })

  it("none verified is active", () => {
    expect(computeProjectStatus(8, 0)).toBe("active")
  })

  it("partially verified is active", () => {
    expect(computeProjectStatus(8, 5)).toBe("active")
  })

  it("100% verified is closed", () => {
    expect(computeProjectStatus(8, 8)).toBe("closed")
  })
})

describe("type guards", () => {
  it("isItemStatus accepts known statuses, rejects others", () => {
    for (const s of ITEM_STATUSES) {
      expect(isItemStatus(s)).toBe(true)
    }
    expect(isItemStatus("done")).toBe(false)
    expect(isItemStatus(undefined)).toBe(false)
    expect(isItemStatus(42)).toBe(false)
  })

  it("isItemPriority accepts known priorities, rejects others", () => {
    for (const p of ITEM_PRIORITIES) {
      expect(isItemPriority(p)).toBe(true)
    }
    expect(isItemPriority("urgent")).toBe(false)
  })
})
