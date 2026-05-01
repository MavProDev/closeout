import type { NextConfig } from "next"

// Pin next/image to the exact Supabase project hostname.
// `*.supabase.co` would proxy any tenant's bucket through our domain
// (cost amplification + cache poisoning). Derive from the env so the
// Vercel-Supabase Marketplace integration stays the source of truth.
const SUPABASE_HOSTNAME = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) return "*.supabase.co" // fallback at build, narrowed by remotePatterns pathname
  try {
    return new URL(url).hostname
  } catch {
    return "*.supabase.co"
  }
})()

// Defense-in-depth headers. Values chosen for an unauthenticated demo
// that loads same-origin scripts, Google Fonts (via next/font),
// and images from Supabase Storage. Tighten when auth lands.
const SECURITY_HEADERS = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `img-src 'self' data: blob: https://${SUPABASE_HOSTNAME}`,
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      `connect-src 'self' https://${SUPABASE_HOSTNAME}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
]

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: SUPABASE_HOSTNAME,
        pathname: "/storage/v1/object/public/punch-photos/**",
      },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }]
  },
}

export default nextConfig
