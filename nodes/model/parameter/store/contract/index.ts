import type {Zavx0zImmersiveTechJsonValueOwn} from "@zavx0z/immersive-tech-json-value-own"
import type {Zavx0zImmersiveNodesModelParameterValueType} from "@zavx0z/immersive-nodes-model-parameter-value-type"
import type {ParameterSnapshot} from "./types"

type JsonValue = Zavx0zImmersiveTechJsonValueOwn.Input[0]

/** Один параметр сохраняет identity, revision и собственный набор подписчиков. */
export declare namespace Zavx0zImmersiveNodesModelParameterStore {
  type Input<T extends JsonValue = JsonValue, TPresentation extends JsonValue = null> = readonly [
    id: string,
    initialValue: T,
    presentation?: TPresentation,
    valueType?: Zavx0zImmersiveNodesModelParameterValueType.Output
  ]

  interface Output<T extends JsonValue = JsonValue, TPresentation extends JsonValue = null> {
    readonly id: string
    readonly revision: number
    readonly value: T
    readonly presentation: TPresentation
    readonly valueType: Zavx0zImmersiveNodesModelParameterValueType.Output | undefined
    set(value: T): boolean
    subscribe(listener: () => void): () => void
    snapshot(): ParameterSnapshot<T, TPresentation>
    toJSON(): ParameterSnapshot<T, TPresentation>
  }
}
