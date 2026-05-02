import { ImageIcon } from "lucide-react"
import Image from "next/image"

import { cn } from "@/lib/utils"

interface ItemPhotoProps {
  src: string | null
  label: string
  /** When true, renders the label badge in the verified-green color
   *  set. Use for completion photos to visually distinguish from
   *  defect photos. */
  accent?: boolean
  /** next/image `sizes` attribute. Tune per layout — list cards
   *  want narrower viewports than the detail-page hero. */
  sizes: string
  className?: string
}

/**
 * Shared ItemPhoto component used by both the list-item card and the
 * item detail page. Centralizes the broken-image fallback, label
 * placement, and accent styling so the two surfaces cannot drift.
 */
export function ItemPhoto({
  src,
  label,
  accent,
  sizes,
  className,
}: ItemPhotoProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-secondary/40",
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={`${label} photo`}
          fill
          sizes={sizes}
          className="object-cover"
        />
      ) : (
        <div className="grid h-full place-items-center text-muted-foreground">
          <div className="flex flex-col items-center gap-2">
            <ImageIcon className="h-6 w-6" />
            {label && (
              <span className="text-xs">No {label.toLowerCase()} photo</span>
            )}
          </div>
        </div>
      )}
      <span
        className={cn(
          "pointer-events-none absolute left-1.5 top-1.5 rounded-sm px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider backdrop-blur",
          accent
            ? "bg-[color:var(--color-status-verified)]/15 text-[color:var(--color-status-verified)]"
            : "bg-background/70 text-muted-foreground",
        )}
      >
        {label}
      </span>
    </div>
  )
}
