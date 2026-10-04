/**
Разбирает шестизначный или восьмизначный HEX-цвет, возвращая RGBA либо null.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiFieldColorValueParse as Contract} from "./contract"
export type {ImmersiveUiFieldColorValueParse} from "./contract"

import normalizeColorValue from "@zavx0z/immersive-ui-field-color-value-normalize"

export default function parseColorValue(value: Contract.Input[0]): Contract.Output {
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
