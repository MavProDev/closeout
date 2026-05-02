import Link from "next/link"
import { ClipboardCheck } from "lucide-react"

import { APP } from "@/lib/copy"
import { cn } from "@/lib/utils"

interface SiteHeaderProps {
  className?: string
}

export function SiteHeader({ className }: SiteHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur",
        className,
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
            <ClipboardCheck className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <span>{APP.name}</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/notes"
            className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Build notes
          </Link>
          <Link
            href="/overrides"
            className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Overrides
          </Link>
          <Link
            href="/audits"
            className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Audits
          </Link>
        </nav>
      </div>
    </header>
  )
}
