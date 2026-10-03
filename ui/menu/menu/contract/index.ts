import type {MenuAction} from "./types.ts"

import type {UiMenus} from "@ui/menus/contract"

/** Собственный вход Menu и общий результат меню. */
export declare namespace UiMenusMenu {
  /**
  Входные данные Menu.
  */
  interface Input {
    readonly open: boolean
    readonly x: number
    readonly y: number
    readonly label?: string
    readonly items: readonly MenuAction[]
    readonly error?: string | null
    readonly onClose: () => void
  }

  type Output = UiMenus.Output
}
