/**
Представление цветового значения.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {FormatColorValueInput} from "./contract/input"
import type {ColorValue} from "@ui-fields-color-value/normalize-color-value"
import normalizeColorValue from "@ui-fields-color-value/normalize-color-value"

export default function formatColorValue(value: FormatColorValueInput[0], includeAlpha: FormatColorValueInput[1] = true): string {
  const color = normalizeColorValue(value)
  const channel = (entry: number): string => Math.round(entry * 255).toString(16).padStart(2, "0").toUpperCase()
  return `#${channel(color.r)}${channel(color.g)}${channel(color.b)}${includeAlpha ? channel(color.a) : ""}`
}

export type {FormatColorValueInput} from "./contract/input"
