import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
import type {ClipboardMenuController} from "./types.ts"

import type {Zavx0zImmersiveUiComponentMenu} from "@zavx0z/immersive-ui-component-menu/contract"

/** Собственный вход ClipboardMenu и общий результат меню. */
export declare namespace Zavx0zImmersiveUiComponentMenuClipboard {
  /** Команды существующего контроллера буфера обмена. */
  interface Input {
    readonly controller: ClipboardMenuController
  }

  type Output = Zavx0zImmersiveUiComponentMenu.Output & JSX.Element
}
