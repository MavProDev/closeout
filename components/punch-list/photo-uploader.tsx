"use client"

import { Camera, Loader2, X } from "lucide-react"
import Image from "next/image"
import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PhotoUploaderProps {
  name: string
  label?: string
  helpText?: string
  required?: boolean
  initialUrl?: string | null
  onUploaded?: (url: string | null) => void
  className?: string
}

const MAX_BYTES = 10 * 1024 * 1024
const ACCEPT =
  "image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"

/**
 * Mobile-first photo uploader.
 *
 * Pipeline:
 *  1. User picks a photo (camera on mobile via capture="environment").
 *  2. If HEIC, convert to JPEG via heic2any.
 *  3. Compress to <=1600px edge with browser-image-compression.
 *  4. POST to /api/upload to get a signed Supabase Storage URL.
 *  5. PUT the file to that signed URL.
 *  6. Hidden input on the form gets the resulting public URL.
 *
 * Why this matters: the form NEVER carries photo bytes. The Server
 * Action just gets a URL string. Avoids two-phase commits and keeps
 * the action codepath fast.
 */
export function PhotoUploader({
  name,
  label = "Photo",
  helpText,
  required = false,
  initialUrl = null,
  onUploaded,
  className,
}: PhotoUploaderProps) {
  const [url, setUrl] = React.useState<string | null>(initialUrl)
  const [busy, setBusy] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  async function handleFile(file: File) {
    if (file.size > MAX_BYTES) {
      toast.error("Photo too large. Max 10 MB.")
      return
    }

    setBusy(true)
    try {
      let workFile: File = file

      // HEIC -> JPEG conversion if needed.
      const isHeic =
        /heic|heif/i.test(file.type) ||
        /\.heic$|\.heif$/i.test(file.name)
      if (isHeic) {
        const heic2any = (await import("heic2any")).default
        const blob = (await heic2any({
          blob: file,
          toType: "image/jpeg",
          quality: 0.85,
        })) as Blob
        workFile = new File(
          [blob],
          file.name.replace(/\.(heic|heif)$/i, ".jpg"),
          { type: "image/jpeg" },
        )
      }

      // Compress to a sensible mobile-friendly edge.
      const { default: imageCompression } = await import(
        "browser-image-compression"
      )
      const compressed = await imageCompression(workFile, {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
      })
      const finalFile = new File([compressed], workFile.name, {
        type: compressed.type || "image/jpeg",
      })

      // Get a signed upload URL from our API.
      const sign = await fetch("/api/upload", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          filename: finalFile.name,
          mime: finalFile.type,
          size: finalFile.size,
        }),
      })
      if (!sign.ok) {
        const body = (await sign.json().catch(() => ({}))) as {
          error?: string
        }
        throw new Error(body.error ?? "Failed to get upload URL.")
      }
      const { signedUrl, publicUrl } = (await sign.json()) as {
        signedUrl: string
        publicUrl: string
      }

      // PUT the file to Supabase Storage.
      const put = await fetch(signedUrl, {
        method: "PUT",
        headers: { "content-type": finalFile.type },
        body: finalFile,
      })
      if (!put.ok) {
        throw new Error(`Upload failed: ${put.status}`)
      }

      setUrl(publicUrl)
      onUploaded?.(publicUrl)
      toast.success("Photo uploaded.")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Upload failed.",
      )
    } finally {
      setBusy(false)
    }
  }

  function clear() {
    setUrl(null)
    onUploaded?.(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive"> *</span>}
        </span>
        {url && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clear}
            disabled={busy}
            className="h-7 px-2 text-xs"
          >
            <X className="mr-1 h-3 w-3" /> Remove
          </Button>
        )}
      </div>

      <input type="hidden" name={name} value={url ?? ""} />

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
        }}
        id={`${name}-file-input`}
      />

      {url ? (
        <label
          htmlFor={`${name}-file-input`}
          className="surface relative block aspect-[4/3] cursor-pointer overflow-hidden"
        >
          <Image
            src={url}
            alt="Uploaded photo preview"
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover"
          />
          {busy && (
            <span className="absolute inset-0 grid place-items-center bg-background/70 backdrop-blur-sm">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </span>
          )}
        </label>
      ) : (
        <label
          htmlFor={`${name}-file-input`}
          className={cn(
            "surface flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 border-dashed text-muted-foreground transition-colors hover:border-primary/50 hover:bg-secondary/40",
            busy && "pointer-events-none opacity-70",
          )}
        >
          {busy ? (
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          ) : (
            <>
              <Camera className="h-7 w-7" />
              <span className="text-sm">Tap to add a photo</span>
              <span className="text-xs">JPG, PNG, WEBP, HEIC up to 10MB</span>
            </>
          )}
        </label>
      )}

      {helpText && (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}
    </div>
  )
}
