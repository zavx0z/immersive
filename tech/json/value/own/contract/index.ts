import type {JsonValue} from "./types"

/** Принадлежащая вызывающему коду неизменяемая копия JSON-значения. */
export declare namespace Zavx0zImmersiveTechJsonValueOwn {
  type Input<T extends JsonValue = JsonValue> = readonly [value: T, label?: string]
  type Output<T extends JsonValue = JsonValue> = T
}
