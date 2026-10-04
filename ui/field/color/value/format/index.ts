/**
Нормализует цвет и форматирует его как HEX со включаемым альфа-каналом.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {Zavx0zImmersiveUiFieldColorValueFormat as Contract} from "./contract"
import normalizeColorValue from "@zavx0z/immersive-ui-field-color-value-normalize"

export default function formatColorValue(value: Contract.Input[0], includeAlpha: Contract.Input[1] = true): Contract.Output {
  const color = normalizeColorValue(value)
  const channel = (entry: number): string => Math.round(entry * 255).toString(16).padStart(2, "0").toUpperCase()
  return `#${channel(color.r)}${channel(color.g)}${channel(color.b)}${includeAlpha ? channel(color.a) : ""}`
}

export type {Zavx0zImmersiveUiFieldColorValueFormat} from "./contract"
