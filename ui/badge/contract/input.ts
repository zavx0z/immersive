import type {BadgeTone} from "./types.ts"

/**
Входные данные Badge.
*/
export interface BadgeProps {
  readonly label: string
  readonly tone?: BadgeTone | undefined
  readonly title?: string | undefined
  readonly style?: CssStyle | undefined
}
