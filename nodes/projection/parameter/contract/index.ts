import type {ExternalStore, ParameterSnapshot, Socket as CoreSocket} from "@immersive-nodes/tree"
import type {ParameterInput} from "./types"
import type {JSX} from "@immersive-jsx-compiler/session"

/** Проекция заимствованного снимка или Store в готовые параметры того же Document. */
export declare namespace ImmersiveNodesProjectionParameter {
  type Input = Readonly<{
    nodeId: string
    snapshot: ParameterSnapshot
    sockets: readonly CoreSocket[]
    store?: ExternalStore<ParameterSnapshot> | undefined
    connectedSocketKeys?: ReadonlySet<string> | undefined
    resolvedSocketSides?: ReadonlyMap<string, "left" | "right"> | undefined
    spacingBefore?: "small" | "medium" | undefined
    style?: CssStyle | undefined
    onInput?: ((change: ParameterInput, event: Event) => void) | undefined
    onChange?: ((change: ParameterInput, event: Event) => void) | undefined
    onSocketActivate?: ((socketId: string, event: Event) => void) | undefined
  }>

  type Output = JSX.Element
}
