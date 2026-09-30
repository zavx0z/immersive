/**
Обработка color-hsva-to-value.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ColorHsvaToValueInput} from "./contract/input"
import type {ColorHsva} from "@ui-fields-color-value/normalize-color-value"
import type {ColorValue} from "@ui-fields-color-value/normalize-color-value"
import clampUnit from "@ui-fields-color-value/clamp-unit"
import normalizeColorValue from "@ui-fields-color-value/normalize-color-value"
import wrapUnit from "@ui-fields-color-value/wrap-unit"

export default function colorHsvaToValue(value: ColorHsvaToValueInput[0]): ColorValue {
  const hue = wrapUnit(value.h ?? 0) * 6
  const saturation = clampUnit(value.s ?? 0)
  const brightness = clampUnit(value.v ?? 0)
  const chroma = brightness * saturation
  const secondary = chroma * (1 - Math.abs((hue % 2) - 1))
  const match = brightness - chroma
  const sector = Math.floor(hue) % 6
  const rgb = sector === 0 ? [chroma, secondary, 0]
    : sector === 1 ? [secondary, chroma, 0]
      : sector === 2 ? [0, chroma, secondary]
        : sector === 3 ? [0, secondary, chroma]
          : sector === 4 ? [secondary, 0, chroma]
            : [chroma, 0, secondary]
  return normalizeColorValue({
    r: rgb[0]! + match,
    g: rgb[1]! + match,
    b: rgb[2]! + match,
    a: value.a ?? 1
  })
}

export type {ColorHsvaToValueInput} from "./contract/input"
