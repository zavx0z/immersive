import type {FrameEdge} from "./types.ts"
import type {FrameHandle} from "./types.ts"

/**
Входные данные Frame.
*/
export interface FrameProps {
  readonly title: string
  readonly edge: FrameEdge
  readonly handles: readonly FrameHandle[]
  readonly style?: CssStyle | undefined
  readonly onHandle?: ((key: string, event: Event) => void) | undefined
}
