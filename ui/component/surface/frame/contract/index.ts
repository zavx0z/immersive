import type {ImmersiveUiComponentSurface} from "@zavx0z/immersive-ui-component-surface/contract"
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
import type {FrameEdge, FrameHandle} from "./types"

/** Рамка рабочей области сохраняет заголовок, команды и содержимое вызывающего владельца. */
export declare namespace ImmersiveUiComponentSurfaceFrame {
  interface Input {
    readonly title: string
    readonly edge: FrameEdge
    readonly handles: readonly FrameHandle[]
    readonly style?: CssStyle | undefined
    readonly onHandle?: ((key: string, event: Event) => void) | undefined
  }

  interface Slots {
    readonly default?: readonly (JSX.Element | string | number | bigint | null | undefined)[]
  }

  type Output = ImmersiveUiComponentSurface.Output & JSX.Element<Slots>
}
