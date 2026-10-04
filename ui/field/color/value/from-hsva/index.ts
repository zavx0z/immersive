/**
Преобразует частичный HSVA-цвет в нормализованный неизменяемый RGBA-цвет.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiFieldColorValueFromHsva as Contract} from "./contract"
export type {ImmersiveUiFieldColorValueFromHsva} from "./contract"

import clampUnit from "@zavx0z/immersive-ui-field-color-value-clamp-unit"
import normalizeColorValue from "@zavx0z/immersive-ui-field-color-value-normalize"
import wrapUnit from "@zavx0z/immersive-ui-field-color-value-wrap-unit"

export default function colorHsvaToValue(value: Contract.Input[0]): Contract.Output {
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
