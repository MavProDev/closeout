import { Plus } from "lucide-react"
import Link from "next/link"
import type { Route } from "next"

import { cn } from "@/lib/utils"

interface FloatingActionButtonProps {
  href: Route
  label: string
  className?: string
}

/**
 * The bottom-right floating action button — primary "add" entry on
 * mobile and desktop. Construction palette: safety orange, square
 * corners on the chip, real shadow underneath. Tap target meets
 * the 44px Apple HIG minimum on coarse pointers.
 */
export function FloatingActionButton({
  href,
  label,
  className,
}: FloatingActionButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        "fixed bottom-6 right-6 z-20 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 font-medium text-primary-foreground shadow-[0_12px_32px_rgba(255,107,53,0.35)] transition-transform hover:-translate-y-0.5 active:translate-y-0",
        className,
      )}
    >
      <Plus className="h-5 w-5" strokeWidth={2.5} />
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">Add</span>
    </Link>
  )
}
