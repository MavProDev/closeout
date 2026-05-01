import "server-only"

import { createAdminSupabase, STORAGE_BUCKET } from "@/lib/supabase"

/**
 * Photo upload helpers. We hand the client a signed upload URL so the
 * browser PUTs the file directly to Supabase Storage, then submits a
 * form with the resulting public URL. This avoids two-phase commits
 * and keeps photo bytes off the Server Action codepath.
 */

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
])
const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

export interface SignedUploadResponse {
  signedUrl: string
  token: string
  path: string
  publicUrl: string
}

export async function createPhotoUpload(
  filename: string,
  mime: string,
): Promise<SignedUploadResponse> {
  if (!ALLOWED_MIME.has(mime)) {
    throw new Error(`Unsupported photo MIME type: ${mime}`)
  }
  const supabase = createAdminSupabase()
  const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg"
  const path = `${crypto.randomUUID()}.${ext}`

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUploadUrl(path)
  if (error || !data) {
    throw new Error(`Failed to create signed upload: ${error?.message ?? "unknown"}`)
  }

  const { data: pub } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path)

  return {
    signedUrl: data.signedUrl,
    token: data.token,
    path,
    publicUrl: pub.publicUrl,
  }
}

export const UPLOAD_LIMITS = {
  maxBytes: MAX_BYTES,
  allowedMime: Array.from(ALLOWED_MIME),
} as const
