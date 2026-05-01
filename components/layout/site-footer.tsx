import { cn } from "@/lib/utils"

interface SiteFooterProps {
  className?: string
}

export function SiteFooter({ className }: SiteFooterProps) {
  return (
    <footer
      className={cn(
        "mt-16 border-t border-border bg-background py-6",
        className,
      )}
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 text-xs text-muted-foreground sm:flex-row sm:justify-between sm:px-6">
        <p>
          Built for the RestoreFast Deployment Engineer take-home.
        </p>
        <p>
          <a
            href="https://github.com/MavProDev/closeout"
            className="underline-offset-4 hover:text-foreground hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/MavProDev/closeout
          </a>
        </p>
      </div>
    </footer>
  )
}
