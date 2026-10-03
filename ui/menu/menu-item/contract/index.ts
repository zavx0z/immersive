

import type {UiMenus} from "@ui/menus/contract"

/** Собственный вход MenuItem и общий результат меню. */
export declare namespace UiMenusMenuItem {
  /**
  Входные данные MenuItem.
  */
  interface Input {
    readonly label: string
    readonly disabled?: boolean | undefined
    readonly shortcut?: string | undefined
    readonly onSelect: () => void
  }

  type Output = UiMenus.Output
}
