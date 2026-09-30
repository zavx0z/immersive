import type {ListItem} from "./types.ts"

/**
Входные данные List.
*/
export interface ListProps {
  readonly items: readonly ListItem[]
  readonly selectedKey?: string | null | undefined
  readonly disabled?: boolean | undefined
  readonly dense?: boolean | undefined
  readonly variant?: "standalone" | "embedded" | undefined
  readonly emptyLabel?: string | undefined
  readonly title?: string | undefined
  readonly style?: CssStyle | undefined
  readonly onSelect?: ((key: string, event: Event) => void) | undefined
}
