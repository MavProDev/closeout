import "server-only"

import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

/**
 * Supabase clients.
 *
 * - `createServerSupabase()` is the cookie-bound SSR client. Used in
 *   Server Components and Route Handlers when we want RLS to apply.
 *
 * - `createAdminSupabase()` is the service-role client. Used in
 *   Server Actions for writes that bypass RLS (V1 has no auth, so
 *   all writes go through this). The service role key must NEVER
 *   reach the browser. The `import "server-only"` at the top of
 *   this file enforces that at build time.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
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

export async function createServerSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", SUPABASE_ANON_KEY),
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value, options } of cookiesToSet) {
            try {
              cookieStore.set(name, value, options)
            } catch {
              // setAll is a no-op when called from a Server Component;
              // middleware refreshes the session instead.
            }
          }
        },
      },
    },
  )
}

/**
 * Service-role client. Server-only. Used for Storage uploads (signed
 * URL issuance) and any write that needs to bypass RLS in V1.
 */
export function createAdminSupabase() {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}

export const PUBLIC_SUPABASE_URL = SUPABASE_URL ?? ""
