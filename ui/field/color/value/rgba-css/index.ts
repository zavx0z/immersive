/**
Форматирует цвет как CSS rgba с байтовыми RGB-каналами и альфой до трёх десятичных знаков.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {Zavx0zImmersiveUiFieldColorValueRgbaCss as Contract} from "./contract"

export default function rgbaCss(value: Contract.Input[0]): Contract.Output {
  const byte = (entry: number): number => Math.round(entry * 255)
  return `rgba(${byte(value.r)}, ${byte(value.g)}, ${byte(value.b)}, ${Math.round(value.a * 1000) / 1000})`
}

export type {Zavx0zImmersiveUiFieldColorValueRgbaCss} from "./contract"
