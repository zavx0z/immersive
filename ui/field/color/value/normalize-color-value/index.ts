/**
Нормализация цветового значения.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {NormalizeColorValueInput} from "./contract/input"
import type {ColorValue} from "./contract/types.ts"
import clampUnit from "@ui-fields-color-value/clamp-unit"

export type {ColorChannel, ColorValue, ColorHsva} from "./contract/types"

export default function normalizeColorValue(value: NormalizeColorValueInput[0]): ColorValue {
  return Object.freeze({
    r: clampUnit(value.r ?? 0),
    g: clampUnit(value.g ?? 0),
    b: clampUnit(value.b ?? 0),
    a: clampUnit(value.a ?? 1)
  })
}

export type {NormalizeColorValueInput} from "./contract/input"
