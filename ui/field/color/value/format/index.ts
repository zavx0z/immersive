/**
Нормализует цвет и форматирует его как HEX со включаемым альфа-каналом.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {UiFieldsColorValueFormatColorValue as Contract} from "./contract"
import normalizeColorValue from "@ui-fields-color-value/normalize-color-value"

export default function formatColorValue(value: Contract.Input[0], includeAlpha: Contract.Input[1] = true): Contract.Output {
  const color = normalizeColorValue(value)
  const channel = (entry: number): string => Math.round(entry * 255).toString(16).padStart(2, "0").toUpperCase()
  return `#${channel(color.r)}${channel(color.g)}${channel(color.b)}${includeAlpha ? channel(color.a) : ""}`
}

export type {UiFieldsColorValueFormatColorValue} from "./contract"
