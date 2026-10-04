import type {Zavx0zImmersiveUiComponent} from "@zavx0z/immersive-ui-component/contract"
import type {BreadcrumbsItem} from "./types.ts"

import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

/** Протокол иерархического пути: сегменты, текущая позиция и намерение перехода. */
export declare namespace Zavx0zImmersiveUiComponentNavigationBreadcrumb {
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
  type Output = Zavx0zImmersiveUiComponent.Output & JSX.Element
}
