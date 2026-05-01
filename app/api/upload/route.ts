import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { UPLOAD_LIMITS, createPhotoUpload } from "@/lib/blob"

const RequestBody = z.object({
  filename: z.string().min(1).max(200),
  mime: z.string().min(1).max(120),
  size: z.number().int().positive(),
})

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const parsed = RequestBody.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid upload request." },
      { status: 400 },
    )
  }

  const { filename, mime, size } = parsed.data

  if (size > UPLOAD_LIMITS.maxBytes) {
    return NextResponse.json(
      { error: `File too large. Max ${UPLOAD_LIMITS.maxBytes} bytes.` },
      { status: 413 },
    )
  }

  if (!UPLOAD_LIMITS.allowedMime.includes(mime)) {
    return NextResponse.json(
      { error: `Unsupported MIME: ${mime}` },
      { status: 415 },
    )
  }

  try {
    const result = await createPhotoUpload(filename, mime)
    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to create upload URL.",
      },
      { status: 500 },
    )
  }
}
