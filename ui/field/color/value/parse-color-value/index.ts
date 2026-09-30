/**
Разбор цветового значения.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ParseColorValueInput} from "./contract/input"
import type {ColorValue} from "@ui-fields-color-value/normalize-color-value"
import normalizeColorValue from "@ui-fields-color-value/normalize-color-value"

export default function parseColorValue(value: ParseColorValueInput[0]): ColorValue | null {
  const hex = value.trim().replace(/^#/, "")
  if (!/^[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?$/.test(hex)) return null
  const channel = (offset: number): number => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255
  return normalizeColorValue({
    r: channel(0),
    g: channel(2),
    b: channel(4),
    a: hex.length === 8 ? channel(6) : 1
  })
}

export type {ParseColorValueInput} from "./contract/input"
