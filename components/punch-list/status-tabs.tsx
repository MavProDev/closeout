"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"

import { TABS } from "@/lib/copy"
import { ITEM_STATUSES, type ItemStatus } from "@/lib/state"
import { cn } from "@/lib/utils"

type Tab = "all" | ItemStatus

interface StatusTabsProps {
  projectId: string
  counts: Record<ItemStatus, number>
  total: number
  className?: string
}

const TAB_ORDER: readonly Tab[] = ["all", ...ITEM_STATUSES] as const

export function StatusTabs({
  projectId,
  counts,
  total,
  className,
}: StatusTabsProps) {
  const params = useSearchParams()
  const active = (params.get("status") ?? "all") as Tab

  return (
    <nav
      className={cn(
        "no-scrollbar flex gap-1 overflow-x-auto border-b border-border",
        className,
      )}
      aria-label="Filter items by status"
    >
      {TAB_ORDER.map((tab) => {
        const isActive = active === tab
        const count = tab === "all" ? total : counts[tab as ItemStatus]
        const href =
          tab === "all"
            ? `/projects/${projectId}`
            : `/projects/${projectId}?status=${tab}`
        return (
          <Link
            key={tab}
            href={href}
            scroll={false}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative inline-flex shrink-0 items-center gap-2 px-3 py-2.5 text-sm transition-colors",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span>{TABS[tab as keyof typeof TABS]}</span>
            <span
              className={cn(
                "min-w-[1.5rem] rounded-full px-1.5 py-0.5 text-center text-[0.65rem] tabular-nums",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground",
              )}
            >
              {count}
            </span>
            {isActive && (
              <span
                aria-hidden
                className="absolute inset-x-0 -bottom-px h-0.5 bg-primary"
              />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
