import type {PaneTextContent} from "./types.ts"
import type {PaneVariant} from "./types.ts"

/**
Входные данные Pane.
*/
export interface PaneProps {
  readonly content?: PaneTextContent
  readonly variant?: PaneVariant | undefined
  readonly title?: string | undefined
  readonly active?: boolean | undefined
  readonly style?: CssStyle | undefined
}
