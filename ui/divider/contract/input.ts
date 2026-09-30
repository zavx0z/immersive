import type {DividerVariant} from "./types.ts"

/**
Входные данные Divider.
*/
export interface DividerProps {
  readonly variant?: DividerVariant | undefined
  readonly title?: string | undefined
  readonly style?: CssStyle | undefined
}
