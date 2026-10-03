import type {Zavx0zUi} from "@zavx0z/ui/contract"
import type {BreadcrumbsItem} from "./types.ts"

import type {JSX} from "@jsx-compiler/session"

/** Протокол иерархического пути: сегменты, текущая позиция и намерение перехода. */
export declare namespace UiNavigationBreadcrumbs {
  /**
  Входные данные Breadcrumbs.
  */
  interface Input {
    readonly items: readonly BreadcrumbsItem[]
    readonly label?: string | undefined
    readonly style?: CssStyle | undefined
    readonly onNavigate?: ((item: BreadcrumbsItem, event: PointerEvent) => void) | undefined
  }

  /** Доступная навигационная область в Document приложения. */
  type Output = Zavx0zUi.Output & JSX.Element
}
