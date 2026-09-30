import type {CollectionFieldDensity} from "./types.ts"
import type {CollectionFieldItem} from "./types.ts"
import type {CollectionFieldMoveDirection} from "./types.ts"

/**
Входные данные CollectionField.
*/
export interface CollectionFieldProps {
  readonly label?: string | undefined
  readonly items: readonly CollectionFieldItem[]
  readonly selectedId: string | null
  readonly visibleRows?: number | undefined
  readonly emptyLabel?: string | undefined
  readonly density?: CollectionFieldDensity | undefined
  readonly disabled?: boolean | undefined
  readonly readOnly?: boolean | undefined
  readonly title?: string | undefined
  readonly style?: CssStyle | undefined
  readonly onSelect?: ((id: string, event: Event) => void) | undefined
  readonly onAdd?: ((event: Event) => void) | undefined
  readonly onRemove?: ((id: string, event: Event) => void) | undefined
  readonly onMove?: ((id: string, direction: CollectionFieldMoveDirection, event: Event) => void) | undefined
}
