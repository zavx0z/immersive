import type {BreadcrumbsItem} from "./types.ts"

/**
Входные данные Breadcrumbs.
*/
export interface BreadcrumbsProps {
  readonly items: readonly BreadcrumbsItem[]
  readonly label?: string | undefined
  readonly style?: CssStyle | undefined
  readonly onNavigate?: ((item: BreadcrumbsItem, event: PointerEvent) => void) | undefined
}
