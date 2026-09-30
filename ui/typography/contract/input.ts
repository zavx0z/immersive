import type {TypographyVariant} from "./types.ts"

/**
Входные данные Typography.
*/
export interface TypographyProps {
  readonly text: string
  readonly variant?: TypographyVariant | undefined
  readonly title?: string | undefined
  readonly style?: CssStyle | undefined
}
