import type {JSX} from "@immersive-jsx-compiler/session"
import type {ClipboardMenuController} from "./types.ts"

import type {ImmersiveUiComponentMenu} from "@immersive-ui-component/menu/contract"

/** Собственный вход ClipboardMenu и общий результат меню. */
export declare namespace ImmersiveUiComponentMenuClipboard {
  /** Команды существующего контроллера буфера обмена. */
  interface Input {
    readonly controller: ClipboardMenuController
  }

  type Output = ImmersiveUiComponentMenu.Output & JSX.Element
}
