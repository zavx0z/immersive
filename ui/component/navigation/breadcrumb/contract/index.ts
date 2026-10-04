import type {ImmersiveUiComponent} from "@immersive-ui/component/contract"
import type {BreadcrumbsItem} from "./types.ts"

import type {JSX} from "@immersive-jsx-compiler/session"

/** Протокол иерархического пути: сегменты, текущая позиция и намерение перехода. */
export declare namespace ImmersiveUiComponentNavigationBreadcrumb {
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
  type Output = ImmersiveUiComponent.Output & JSX.Element
}
