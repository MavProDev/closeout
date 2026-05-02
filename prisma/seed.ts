/**
 * Seed data for Closeout.
 *
 * Two demo projects ship by default:
 *
 *   1. Krusty Krab — the punchline. Real construction-defect language
 *      in absurd locations; the contrast IS the joke. All photos shipped.
 *      Items span all four states so the dashboard tells the full story
 *      on first load. Items 4 and 5 are the demo's key moment: complete
 *      with completion photo uploaded, awaiting GC sign-off.
 *
 *   2. Westgate Tower — a six-unit multi-family water-loss closeout.
 *      Realistic restoration vocabulary, no photos (mid-stream punch
 *      list before final docs), demonstrating the app handles text-only
 *      flows where photo evidence comes later in the cycle.
 *
 * Photo paths point at /public/seed/. Drop AI-generated defect images
 * with those filenames and they resolve automatically.
 */

import { PrismaClient } from "@prisma/client"

import type { ItemPriority, ItemStatus } from "@/lib/state"

const prisma = new PrismaClient()

interface SeedProject {
  name: string
  address: string
  status: string
  daysAgoCreated: number
  items: SeedItem[]
}

interface SeedItem {
  location: string
  description: string
  status: ItemStatus
  priority: ItemPriority
  assignedTo: string | null
  photo: string | null
  completionPhoto: string | null
  daysAgo: number
}

const KRUSTY_KRAB_ITEMS: SeedItem[] = [
  {
    location: "Kitchen, behind grill",
    description:
      "Drywall patch needed where Patrick installed the new ventilation hood; paper torn, exposed studs, six-inch ragged hole.",
    status: "open",
    priority: "normal",
    assignedTo: null,
    photo: "/seed/01-defect.jpg",
    completionPhoto: null,
    daysAgo: 3,
  },
  {
    location: "Front Counter, north wall",
    description:
      "Outlet at Squidward's register reads 87V on the meter. Cover plate hanging loose. Recommend replace device, retorque under load.",
    status: "in_progress",
    priority: "high",
    assignedTo: "Jose M.",
    photo: "/seed/02-defect.jpg",
    completionPhoto: null,
    daysAgo: 5,
  },
  {
    location: "Dining Room, booth 2 window",
    description:
      "Front window exterior seal failing, evidence of water intrusion in drywall below sill. Reseal and patch interior face.",
    status: "in_progress",
    priority: "normal",
    assignedTo: "Pete D.",
    photo: "/seed/03-defect.jpg",
    completionPhoto: null,
    daysAgo: 4,
  },
  {
    location: "Kitchen, floor sections 3 and 4",
    description:
      "Tile grout color mismatch where two pours met at expansion joint. Cut out, regrout matched lot, seal.",
    status: "complete",
    priority: "low",
    assignedTo: "Jose M.",
    photo: "/seed/04-defect.jpg",
    completionPhoto: "/seed/04-completion.jpg",
    daysAgo: 9,
  },
  {
    location: "Dining Area, ceiling",
    description:
      "HVAC return air grille hanging by one screw, vibrating against drywall. Reattach with full screw set, isolators replaced.",
    status: "complete",
    priority: "normal",
    assignedTo: "Mike R.",
    photo: "/seed/05-defect.jpg",
    completionPhoto: "/seed/05-completion.jpg",
    daysAgo: 7,
  },
  {
    location: "Stockroom Stair, landing 2",
    description:
      "Handrail bracket pulled out of wall, anchor hole blown. Reanchor with 1/2 inch toggle bolts to backing plate, repaint.",
    status: "verified",
    priority: "critical",
    assignedTo: "Pete D.",
    photo: "/seed/06-defect.jpg",
    completionPhoto: "/seed/06-completion.jpg",
    daysAgo: 11,
  },
  {
    location: "Dining Room, east column",
    description:
      "Vertical scaffolding scuff on column face, primer exposed. Sand to feather, prime spot, two coats finish to match.",
    status: "verified",
    priority: "low",
    assignedTo: "Jose M.",
    photo: "/seed/07-defect.jpg",
    completionPhoto: "/seed/07-completion.jpg",
    daysAgo: 12,
  },
  {
    location: "Walk-In Freezer, door",
    description:
      "Was previously verified, owner walkthrough rejected on second visit: door trim gap reopened, daylight visible at hinge side. Re-shim, regasket.",
    status: "in_progress",
    priority: "high",
    assignedTo: "Mike R.",
    photo: "/seed/08-defect.jpg",
    completionPhoto: null,
    daysAgo: 2,
  },
  {
    location: "Kitchen, Type 1 hood",
    description:
      "Hood filters grease-saturated. K-class extinguisher tag expired Q2. Fire suppression service overdue per NFPA 96. Schedule certified vendor before reopen.",
    status: "open",
    priority: "critical",
    assignedTo: null,
    photo: "/seed/09-defect.jpg",
    completionPhoto: null,
    daysAgo: 1,
  },
  {
    location: "Cashier Station, drive-up cutout",
    description:
      "Counter opening lacks structural header. Hairline crack in drywall above progressing weekly per monitoring tape. Engineer to spec retrofit header before close.",
    status: "in_progress",
    priority: "high",
    assignedTo: "Pete D.",
    photo: "/seed/10-defect.jpg",
    completionPhoto: null,
    daysAgo: 6,
  },
  {
    location: "Dining Room, east wall vent",
    description:
      "Negative pressure imbalance pulling cooking odors from adjacent tenant unit. Rebalance HVAC supply / return, install neoprene gasket on shared partition penetrations.",
    status: "in_progress",
    priority: "normal",
    assignedTo: "Mike R.",
    photo: "/seed/11-defect.jpg",
    completionPhoto: null,
    daysAgo: 4,
  },
  {
    // The human-touch item — Ian shot this one himself as a signature
    // on an otherwise AI-built submission. Reads as a real construction
    // defect (unauthorized employee-built structure inside food storage,
    // blocked egress, scattered product, code violations) with the
    // franchise jokes hiding for the second look.
    location: "Walk-In Cooler, north corner",
    description:
      "Unauthorized employee-built wooden structure inside walk-in storage; improper construction blocking egress, caution tape from a prior incident, scattered food product on floor indicating sanitation breach. Top-secret-labeled crate stored without inventory chain documentation. Demo, sanitize, and reconcile inventory before next health inspection.",
    status: "open",
    priority: "critical",
    assignedTo: null,
    photo: "/seed/12-defect.png",
    completionPhoto: null,
    daysAgo: 0,
  },
]

// Westgate Tower — six-unit multi-family Cat 2 water-loss closeout.
// Mid-stream punch list. No images bundled (text-only flow on purpose;
// proves the app handles the early/middle phases of a job before
// photo evidence is uploaded). Vocabulary mirrors what shows up on
// real restoration scopes of work and adjuster file requests.
const WESTGATE_ITEMS: SeedItem[] = [
  {
    location: "Unit 7C, south bedroom sub-floor",
    description:
      "Moisture reading 18% at south wall sub-floor (threshold 16%). Re-deploy LGR dehumidifier 24h, re-mete before sign-off. Daily psychrometric log required for adjuster file.",
    status: "in_progress",
    priority: "high",
    assignedTo: "Marcus T.",
    photo: null,
    completionPhoto: null,
    daysAgo: 1,
  },
  {
    location: "Unit 7B, kitchen north wall",
    description:
      "Drywall tide-line cut left ragged after demo. Re-cut clean to next stud, prep for closer. Document final cut height in scope-vs-actual log.",
    status: "open",
    priority: "normal",
    assignedTo: null,
    photo: null,
    completionPhoto: null,
    daysAgo: 2,
  },
  {
    location: "East stairwell, levels 6-8",
    description:
      "Anti-microbial application missing lot-number receipt. Adjuster file requires product name, batch, and applied area. Re-document or reapply with chain-of-custody record.",
    status: "in_progress",
    priority: "high",
    assignedTo: "Diana R.",
    photo: null,
    completionPhoto: null,
    daysAgo: 3,
  },
  {
    location: "Unit 7D, full pack-out",
    description:
      "Content pack-out manifest missing 3 items per tenant inventory: kitchen drawer organizers, baby monitor, framed wall art (master bedroom). Reconcile with warehouse manifest, photograph staged contents.",
    status: "in_progress",
    priority: "high",
    assignedTo: "Sarah B.",
    photo: null,
    completionPhoto: null,
    daysAgo: 2,
  },
  {
    location: "Unit 7F, daily moisture log",
    description:
      "14-hour gap in psychrometric readings overnight day 4 (logger battery failed at 23:14, restored next day at 13:14). Adjuster requires uninterrupted log for billing. Reconstruct from secondary logger or note formal interpolation.",
    status: "in_progress",
    priority: "critical",
    assignedTo: "Marcus T.",
    photo: null,
    completionPhoto: null,
    daysAgo: 1,
  },
  {
    location: "Unit 7B, master closet floor cavity",
    description:
      "Microbial strip-test returned positive, area contained per containment plan. Remediation per industry standard, retest required before closer. Notify adjuster of scope expansion.",
    status: "in_progress",
    priority: "critical",
    assignedTo: "Diana R.",
    photo: null,
    completionPhoto: null,
    daysAgo: 0,
  },
  // The next two are deliberately kept at in_progress. The app blocks
  // the in_progress -> complete transition without a completion photo
  // (lib/actions/items.ts:97), and the Westgate demo has no bundled
  // restoration imagery yet — promoting them past the photo gate via
  // direct DB writes would contradict the four-state pattern this app
  // sells. They sit awaiting their proof artifact, which is exactly
  // what the workflow says happens before the GC, owner, or adjuster
  // reviews the work.
  {
    location: "Unit 7E, hallway vapor barrier",
    description:
      "Vapor barrier seam at west doorway lifting. Re-seam and seal-tape per scope. Photograph completed seam for closer before signing off.",
    status: "in_progress",
    priority: "normal",
    assignedTo: "Tom K.",
    photo: null,
    completionPhoto: null,
    daysAgo: 4,
  },
  {
    location: "East stairwell, level 7 landing",
    description:
      "Exit sign was removed during ceiling demo and not reinstalled. Code violation if a fire occurred during work hours. Reinstall, test, photograph for adjuster file before sign-off.",
    status: "in_progress",
    priority: "critical",
    assignedTo: "Tom K.",
    photo: null,
    completionPhoto: null,
    daysAgo: 6,
  },
]

const PROJECTS: SeedProject[] = [
  {
    name: "Krusty Krab: Health Code Punchout",
    address: "831 Bottom Feeder Lane, Bikini Bottom",
    status: "active",
    daysAgoCreated: 14,
    items: KRUSTY_KRAB_ITEMS,
  },
  {
    name: "Westgate Tower — Floor 7 Water Mitigation Closeout",
    address: "1418 Westgate Boulevard, Unit 7A-7F",
    status: "active",
    // Older than Krusty Krab so the joke project keeps the top slot
    // on the project list (createdAt DESC sort).
    daysAgoCreated: 20,
    items: WESTGATE_ITEMS,
  },
]

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

async function main() {
  console.log("[seed] start")

  const now = Date.now()
  let totalItems = 0

  for (const proj of PROJECTS) {
    // Idempotent per project: wipe and re-seed if already present.
    const existing = await prisma.project.findFirst({
      where: { name: proj.name },
      select: { id: true },
    })
    if (existing) {
      console.log(`[seed] removing existing demo items for ${proj.name}`)
      // Project -> PunchItem onDelete: Cascade handles child rows.
      await prisma.project.delete({ where: { id: existing.id } })
    }

    const project = await prisma.project.create({
      data: {
        name: proj.name,
        address: proj.address,
        status: proj.status,
        createdAt: new Date(now - proj.daysAgoCreated * DAY),
      },
    })
    console.log(`[seed] project ${project.id} (${proj.name})`)

    for (const item of proj.items) {
      const createdAt = new Date(now - item.daysAgo * DAY)
      const completedAt =
        item.status === "complete" || item.status === "verified"
          ? new Date(createdAt.getTime() + 6 * HOUR)
          : null
      const verifiedAt =
        item.status === "verified"
          ? new Date(createdAt.getTime() + 12 * HOUR)
          : null

      await prisma.punchItem.create({
        data: {
          projectId: project.id,
          location: item.location,
          description: item.description,
          status: item.status,
          priority: item.priority,
          assignedTo: item.assignedTo,
          photo: item.photo,
          completionPhoto: item.completionPhoto,
          createdAt,
          completedAt,
          verifiedAt,
        },
      })
    }
    totalItems += proj.items.length
  }

  console.log(`[seed] inserted ${totalItems} items across ${PROJECTS.length} projects`)
  console.log("[seed] done")
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
