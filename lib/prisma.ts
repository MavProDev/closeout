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

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
