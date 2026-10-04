import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
import type {MenuAction} from "./types.ts"

import type {Zavx0zImmersiveUiComponentMenu} from "@zavx0z/immersive-ui-component-menu/contract"

/** Собственный вход Menu и общий результат меню. */
export declare namespace Zavx0zImmersiveUiComponentMenuBasic {
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

  type Output = Zavx0zImmersiveUiComponentMenu.Output & JSX.Element
}
