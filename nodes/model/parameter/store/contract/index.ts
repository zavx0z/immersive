import type {ImmersiveTechJsonValueOwn} from "@zavx0z/immersive-tech-json-value-own"
import type {ImmersiveNodesModelParameterValueType} from "@zavx0z/immersive-nodes-model-parameter-value-type"
import type {ParameterSnapshot} from "./types"

type JsonValue = ImmersiveTechJsonValueOwn.Input[0]

/** Один параметр сохраняет identity, revision и собственный набор подписчиков. */
export declare namespace ImmersiveNodesModelParameterStore {
  type Input<T extends JsonValue = JsonValue, TPresentation extends JsonValue = null> = readonly [
    id: string,
    initialValue: T,
    presentation?: TPresentation,
    valueType?: ImmersiveNodesModelParameterValueType.Output
  ]

  interface Output<T extends JsonValue = JsonValue, TPresentation extends JsonValue = null> {
    readonly id: string
    readonly revision: number
    readonly value: T
    readonly presentation: TPresentation
    readonly valueType: ImmersiveNodesModelParameterValueType.Output | undefined
    set(value: T): boolean
    subscribe(listener: () => void): () => void
    snapshot(): ParameterSnapshot<T, TPresentation>
    toJSON(): ParameterSnapshot<T, TPresentation>
  }
}
