import type {NodeValuesOwn} from "@node-values/own"
import type {NodeValuesType} from "@node-values/type"
import type {ParameterSnapshot} from "./types"

type JsonValue = NodeValuesOwn.Input[0]

/** Один параметр сохраняет identity, revision и собственный набор подписчиков. */
export declare namespace NodesParameterStore {
  type Input<T extends JsonValue = JsonValue, TPresentation extends JsonValue = null> = readonly [
    id: string,
    initialValue: T,
    presentation?: TPresentation,
    valueType?: NodeValuesType.Output
  ]

  interface Output<T extends JsonValue = JsonValue, TPresentation extends JsonValue = null> {
    readonly id: string
    readonly revision: number
    readonly value: T
    readonly presentation: TPresentation
    readonly valueType: NodeValuesType.Output | undefined
    set(value: T): boolean
    subscribe(listener: () => void): () => void
    snapshot(): ParameterSnapshot<T, TPresentation>
    toJSON(): ParameterSnapshot<T, TPresentation>
  }
}
