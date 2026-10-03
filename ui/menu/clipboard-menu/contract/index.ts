import type {ClipboardMenuController} from "./types.ts"

import type {UiMenus} from "@ui/menus/contract"

/** Собственный вход ClipboardMenu и общий результат меню. */
export declare namespace UiMenusClipboardMenu {
  /** Команды существующего контроллера буфера обмена. */
  interface Input {
    readonly controller: ClipboardMenuController
  }

  type Output = UiMenus.Output
}
