import { ItemCard, type ItemCardData } from "@/components/punch-list/item-card"
import { EMPTY_STATES } from "@/lib/copy"
import type { ItemStatus } from "@/lib/state"
import { cn } from "@/lib/utils"

interface ItemListProps {
  items: ItemCardData[]
  filter: ItemStatus | "all"
  className?: string
}

export function ItemList({ items, filter, className }: ItemListProps) {
  if (items.length === 0) {
    return (
      <div
        className={cn(
          "surface mt-4 grid place-items-center p-12 text-center text-sm text-muted-foreground",
          className,
        )}
      >
        {filter === "all" ? EMPTY_STATES.noItems : EMPTY_STATES.noItemsInTab}
      </div>
    )
  }
  return (
    <ul
      className={cn(
        "mt-4 flex flex-col gap-3",
        className,
      )}
    >
      {items.map((item) => (
        <li key={item.id}>
          <ItemCard item={item} />
        </li>
      ))}
    </ul>
  )
}
