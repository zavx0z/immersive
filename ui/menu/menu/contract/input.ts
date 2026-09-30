import type {MenuAction} from "./types.ts"

/**
Входные данные Menu.
*/
export interface MenuProps {
  readonly open: boolean
  readonly x: number
  readonly y: number
  readonly label?: string
  readonly items: readonly MenuAction[]
  readonly error?: string | null
  readonly onClose: () => void
}
