import { PrismaClient } from "@prisma/client"

/**
 * Prisma Client singleton.
 *
 * Next.js (especially in dev with HMR) tears down and reinstantiates
 * modules frequently. Without the globalThis caching, you can exhaust
 * Postgres connections in seconds. The pattern below is the canonical
 * Prisma-on-Next solution: one client per process, shared across
 * Server Components and Server Actions.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Log levels: in dev we want signal but not full SQL bodies (they
// contain user input including assignee names and free-text
// descriptions; an accidental screenshot of the dev terminal would
// leak parameter values). In production only emit errors.
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
