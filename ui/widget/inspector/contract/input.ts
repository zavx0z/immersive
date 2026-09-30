import type {InspectorAction} from "./types.ts"
import type {InspectorCategory} from "./types.ts"
import type {InspectorContext} from "./types.ts"

/**
Входные данные Inspector.
*/
export interface InspectorProps {
  readonly ariaLabel?: string | undefined
  readonly categoriesLabel?: string | undefined
  readonly categories: readonly InspectorCategory[]
  readonly selectedCategoryId: string
  readonly query: string
  readonly searchLabel?: string | undefined
  readonly searchPlaceholder?: string | undefined
  readonly toolbarLeadingActions?: readonly InspectorAction[] | undefined
  readonly toolbarActions?: readonly InspectorAction[] | undefined
  readonly context?: InspectorContext | undefined
  readonly style?: CssStyle | undefined
  readonly onCategoryChange?: ((id: string, event: Event) => void) | undefined
  readonly onQueryChange?: ((query: string, event: Event) => void) | undefined
}
