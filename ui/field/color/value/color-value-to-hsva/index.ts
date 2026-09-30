/**
Обработка color-value-to-hsva.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ColorValueToHsvaInput} from "./contract/input"
import type {ColorHsva} from "@ui-fields-color-value/normalize-color-value"
import type {ColorValue} from "@ui-fields-color-value/normalize-color-value"
import normalizeColorValue from "@ui-fields-color-value/normalize-color-value"
import wrapUnit from "@ui-fields-color-value/wrap-unit"

export default function colorValueToHsva(value: ColorValueToHsvaInput[0]): ColorHsva {
  const color = normalizeColorValue(value)
  const maximum = Math.max(color.r, color.g, color.b)
  const minimum = Math.min(color.r, color.g, color.b)
  const delta = maximum - minimum
  let hue = 0
  if (delta > 0) {
    if (maximum === color.r) hue = ((color.g - color.b) / delta) % 6
    else if (maximum === color.g) hue = (color.b - color.r) / delta + 2
    else hue = (color.r - color.g) / delta + 4
    hue /= 6
  }
  return Object.freeze({
    h: wrapUnit(hue),
    s: maximum <= 0 ? 0 : delta / maximum,
    v: maximum,
    a: color.a
  })
}

export type {ColorValueToHsvaInput} from "./contract/input"
