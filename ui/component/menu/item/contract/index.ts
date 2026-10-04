import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"


import type {Zavx0zImmersiveUiComponentMenu} from "@zavx0z/immersive-ui-component-menu/contract"

/** Собственный вход MenuItem и общий результат меню. */
export declare namespace Zavx0zImmersiveUiComponentMenuItem {
  /**
  Входные данные MenuItem.
  */
  interface Input {
    readonly label: string
    readonly disabled?: boolean | undefined
    readonly shortcut?: string | undefined
    readonly onSelect: () => void
  }

  type Output = Zavx0zImmersiveUiComponentMenu.Output & JSX.Element
}
