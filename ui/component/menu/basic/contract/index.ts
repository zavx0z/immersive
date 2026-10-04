import type {JSX} from "@immersive-jsx-compiler/session"
import type {MenuAction} from "./types.ts"

import type {ImmersiveUiComponentMenu} from "@immersive-ui-component/menu/contract"

/** Собственный вход Menu и общий результат меню. */
export declare namespace ImmersiveUiComponentMenuBasic {
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

  type Output = ImmersiveUiComponentMenu.Output & JSX.Element
}
