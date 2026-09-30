/**
Обработка rgba-css.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {RgbaCssInput} from "./contract/input"
import type {ColorValue} from "@ui-fields-color-value/normalize-color-value"

export default function rgbaCss(value: RgbaCssInput[0]): string {
  const byte = (entry: number): number => Math.round(entry * 255)
  return `rgba(${byte(value.r)}, ${byte(value.g)}, ${byte(value.b)}, ${Math.round(value.a * 1000) / 1000})`
}

export type {RgbaCssInput} from "./contract/input"
