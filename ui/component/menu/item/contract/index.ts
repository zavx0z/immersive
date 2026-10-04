import type {JSX} from "@immersive-jsx-compiler/session"


import type {ImmersiveUiComponentMenu} from "@immersive-ui-component/menu/contract"

/** Собственный вход MenuItem и общий результат меню. */
export declare namespace ImmersiveUiComponentMenuItem {
  /**
  Входные данные MenuItem.
  */
  interface Input {
    readonly label: string
    readonly disabled?: boolean | undefined
    readonly shortcut?: string | undefined
    readonly onSelect: () => void
  }

  type Output = ImmersiveUiComponentMenu.Output & JSX.Element
}
