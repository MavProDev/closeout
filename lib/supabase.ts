import "server-only"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Service-role Supabase client. Server-only.
 *
 * Used by Server Actions for Storage operations (signed-upload URL
 * minting via lib/blob.ts) that must bypass RLS. The service-role key
 * MUST NEVER reach the browser; the `import "server-only"` at the top
 * of this file enforces that at build time.
 *
 * The client is cached at module scope so a function instance under
 * load doesn't allocate one per request.
 *
 * V1 has no auth, so the cookie-bound `createServerSupabase` SSR
 * client was removed as dead code — it would only earn its keep when
 * sessions exist. When auth lands in V2, restore it from
 * `@supabase/ssr` and gate every Server Action on
 * `getUser()` before invoking the admin client.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export const STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET ?? "punch-photos"

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. See .env.example.`,
    )
  }
  return value
}

let _admin: SupabaseClient | null = null

export function createAdminSupabase(): SupabaseClient {
  if (_admin) return _admin
  _admin = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
  return _admin
}

export const PUBLIC_SUPABASE_URL = SUPABASE_URL ?? ""
