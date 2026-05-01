# Closeout

Punch list tracker built for the RestoreFast Deployment Engineer take-home.

**Live:** https://closeout-murex.vercel.app
**Repo:** https://github.com/MavProDev/closeout
**Build notes & cuts:** https://closeout-murex.vercel.app/notes
**Audit results:** https://closeout-murex.vercel.app/audits

---

## The insight

The schema RestoreFast supplied has a workflow constraint hiding in plain
sight, and the spec hints at it. `open / in_progress / complete` is not
enough states for a real construction punch list. The industry uses four.
The fourth is **verified** — the GC's or owner's sign-off after physical
reinspection. Without it, a worker can mark their own work complete with no
proof. Smartsheet, EB3, Kahua, and Fieldwire all converge on this model;
EB3 stated it directly: they do not mark items complete based solely on
contractor reports or photographic evidence. Each verified correction
receives formal sign-off, creating a permanent record of acceptance.

The completion photo is gated on `in_progress -> complete` (the worker
proves the fix), not on `complete -> verified` (different actor — GC sign
off, no new photo). Reopen path is wired so a rejected verified item flows
back to in_progress with timestamps cleared.

That's V1. The state machine extension is the headline; everything else
follows from reading the schema as a workflow tool instead of a CRUD model.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript strict · Prisma 6 · Supabase
Postgres · Supabase Storage · Supabase RLS · shadcn/ui · Tailwind v4 ·
Sonner · Vercel. Provisioning via the **Vercel-Supabase Marketplace
integration** so secrets auto-flow into the Vercel project — no manual
copy/paste.

This matches RestoreFast's listed stack one-to-one. tRPC, Trigger.dev,
Stripe, and Twilio are deliberately out of V1 scope (see
[/notes](https://closeout-murex.vercel.app/notes) for the cut list).

## What I added to the schema (and why)

The original RestoreFast field names are preserved exactly. Four field
extensions and three indexes turn the model from CRUD into a workflow tool.

| Addition | Reason |
|---|---|
| `PunchItem.updatedAt @updatedAt` | Workflow tools require an audit trail. You cannot reason about cycle time, stale items, or rework rates without it. |
| `PunchItem.completionPhoto` | The defect photo and the completion photo are different artifacts at different gates. Industry best practice (EB3). The spec's single `photo` field can't represent both. |
| `PunchItem.completedAt` / `verifiedAt` | Timestamps for the third and fourth state transitions enable closeout-velocity reporting and retainage-release timing. |
| `PunchItem.deletedAt` (soft delete only) | Construction audit trails are legally relevant. Items are never hard-deleted. |
| `Project.updatedAt` | Same audit-trail rationale at the project level. |
| `@@index([projectId, status])` | Every dashboard breakdown query hits this. |
| `@@index([projectId, priority])` | Same, for the priority breakdown. |
| `@@index([projectId, deletedAt])` | Makes the soft-delete filter cheap. |
| `Project ⇢ PunchItem onDelete: Cascade` | Safety net if a project is ever hard-deleted directly in SQL. The UI never does this. |

Project status is left as a `String` column with a default of `'active'`,
unchanged from the original spec, but is **computed** at render time as
`closed` when 100% of non-deleted items are `verified`. The column itself
isn't written to — the UI is the source of truth, by design.

## State machine

Pure functions in [`lib/state.ts`](./lib/state.ts), no React, no Prisma, no
I/O. Importable from server actions and tests.

```ts
export const VALID_TRANSITIONS: Record<ItemStatus, readonly ItemStatus[]> = {
  open:        ["in_progress"],
  in_progress: ["complete", "open"],
  complete:    ["verified", "in_progress"],
  verified:    ["in_progress"],
}
```

The completion-photo gate sits on `in_progress -> complete` (the worker
proves the fix). The verified transition is the GC sign-off — different
actor, no new photo. The `verified -> in_progress` reopen path is for when
a later walkthrough rejects a previously verified item; it clears
`verifiedAt` and `completedAt` so the audit trail is honest.

29 vitest unit tests in [`__tests__/state-machine.test.ts`](./__tests__/state-machine.test.ts)
exhaustively cover every transition, every gate, every side-effect, plus
type guards. State machine logic is the most load-bearing thing in the app
and the only thing that gets unit tests.

## Server actions

All mutations are Server Actions with **optimistic concurrency**. The
critical bit lives in `lib/actions/items.ts:transitionStatus`:

```ts
const result = await prisma.punchItem.updateMany({
  where: {
    id: itemId,
    status: fromStatus,            // expected current status
    assignedTo: existing.assignedTo, // expected current assignee
    deletedAt: null,
  },
  data: { status: toStatus, ...effects },
})
if (result.count === 0) {
  return { ok: false, error: VALIDATION_ERRORS.staleState }
}
```

Two foremen on the same item in different tabs cannot race. The second
transition fails atomically and the user is told to refresh.

## Run locally

```bash
nvm use                    # node 22
pnpm install
pnpm test                  # state machine tests
pnpm typecheck
pnpm lint
pnpm build                 # requires env vars below
```

Env vars come from the Vercel-Supabase Marketplace integration. To set up a
fresh Supabase project locally, copy `.env.example` to `.env.local` and
fill the values from the Supabase dashboard, then run:

```bash
pnpm db:migrate            # prisma migrate dev
pnpm db:seed               # populate the Krusty Krab demo
pnpm dev
```

Or just deploy to Vercel — the included `vercel-build` script runs
`prisma generate && prisma migrate deploy && next build`, so a fresh deploy
brings up the full schema automatically.

## Deploy

1. Create a Supabase project (this app uses the official
   [Vercel-Supabase Marketplace integration](https://vercel.com/marketplace/supabase)).
2. Create a Vercel project from this GitHub repo.
3. In the Vercel project's **Storage** tab, **Connect Database → Supabase →
   pick your Supabase project**. The integration auto-injects all 16 env
   vars (`POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`,
   `SUPABASE_SERVICE_ROLE_KEY`, etc.) into the Vercel project. No manual
   copy/paste of secrets, ever — they live in the integration and rotate
   automatically when you reset the database password.
4. Push to `master`. Vercel runs `vercel-build` (Prisma generate + migrate
   deploy + Next build) and deploys.
5. Storage bucket `punch-photos` (public read, service-role write, 10 MB
   max, image MIME whitelist) is configured during initial setup. RLS
   policies for `Project` and `PunchItem` are committed in
   `prisma/migrations/`.

## What I would build next

7 features I'd ship in V2, ordered by user-impact-per-engineering-hour:

1. **Worker as a real table.** `assignedTo` becomes a foreign key. Unlocks
   per-worker dashboards, per-worker mobile views, role-based access.
2. **Trigger.dev background job to auto-flag stale `in_progress` items**
   past their due date. The schema already has `updatedAt`. RestoreFast's
   stack already includes Trigger.dev — natural V2.
3. **Plan markup overlay.** Drop pins on a floor plan PDF. The gold-standard
   punch-list UX. Out of scope for the take-home but the obvious next move.
4. **Real auth with Supabase RLS scoping per-project access.** RLS policies
   are already in V1 — auth.uid() scoping is a one-line edit per policy.
5. **Rate limiting on item creation and photo upload.** Upstash Redis on the
   Edge. Skipped in V1 deliberately for demo speed.
6. **tRPC for the API layer.** Server Actions are the right answer at this
   size. tRPC earns its keep when the API surface gets large enough that an
   RPC contract pays for itself.
7. **Realtime sync via Supabase Realtime channels** for multi-foreman
   collaboration. RLS + per-project channels are ~50 lines.

## AI tools used

Claude Opus 4.7 for planning. Claude Code for execution. Eight override
moments captured live in the build journal — the four most representative
are published on
[/notes](https://closeout-murex.vercel.app/notes#override-moments-where-the-human-caught-the-ai).

## License

MIT
