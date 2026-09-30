import type {StatusBarItem} from "./types.ts"

/**
Входные данные StatusBar.
*/
export interface StatusBarProps {
  readonly start?: readonly StatusBarItem[] | undefined
  readonly end?: readonly StatusBarItem[] | undefined
  readonly separator?: string | undefined
  readonly title?: string | undefined
  readonly style?: CssStyle | undefined
}
