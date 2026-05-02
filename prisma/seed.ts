/**
 * Seed data for Closeout.
 *
 * The demo project name is the punchline. Real construction-defect
 * language in real Krusty Krab locations — the contrast IS the joke.
 * Items deliberately span all four states so the dashboard tells the
 * full story on first load. Items 4 and 5 are the demo's key moment:
 * complete with completion photo uploaded, awaiting GC sign-off.
 *
 * Photo paths point at /public/seed/. Drop AI-generated defect images
 * with those filenames and they resolve automatically.
 */

import { PrismaClient } from "@prisma/client"

import type { ItemPriority, ItemStatus } from "@/lib/state"

const prisma = new PrismaClient()

const PROJECT = {
  name: "Krusty Krab: Health Code Punchout",
  address: "831 Bottom Feeder Lane, Bikini Bottom",
  status: "active",
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

const ITEMS: SeedItem[] = [
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
]

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

async function main() {
  console.log("[seed] start")

  // Idempotent: if a project with this name already exists, wipe its
  // items and start over. This makes `pnpm db:seed` safe to re-run
  // when Ian drops photos and we want fresh timestamps.
  const existing = await prisma.project.findFirst({
    where: { name: PROJECT.name },
    select: { id: true },
  })
  if (existing) {
    console.log(`[seed] removing existing demo items for project ${existing.id}`)
    await prisma.punchItem.deleteMany({ where: { projectId: existing.id } })
    await prisma.project.delete({ where: { id: existing.id } })
  }

  const now = Date.now()
  const project = await prisma.project.create({
    data: {
      name: PROJECT.name,
      address: PROJECT.address,
      status: PROJECT.status,
      createdAt: new Date(now - 14 * DAY),
    },
  })
  console.log(`[seed] project ${project.id}`)

  for (const item of ITEMS) {
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

  console.log(`[seed] inserted ${ITEMS.length} items`)
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
