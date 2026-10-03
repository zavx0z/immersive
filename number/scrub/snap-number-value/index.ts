/**
Привязывает число к шагу диапазона, сохраняя его граничные и неконечные значения.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {UiFieldsNumberScrubSnapNumberValue as Contract} from "./contract"
import {roundHalfAwayFromZero} from "./src/helpers.ts"
import roundedNumber from "@ui-fields-number-value/rounded-number"
import type {NumberRange} from "@ui-fields-number-value/resolve-number-soft-range"

export default function snapNumberValue(
  value: Contract.Input[0],
  range: Contract.Input[1],
  small: Contract.Input[2] = false
): Contract.Output {
  if (!Number.isFinite(value) || value === range.min || value === range.max) return value
  const span = range.max - range.min
  if (!Number.isFinite(span) || span <= 0) return value
  const baseIncrement = span < 2.1 ? 0.1 : span < 21 ? 1 : 10
  const increment = baseIncrement * (small ? 0.1 : 1)
  const snapped = roundHalfAwayFromZero(value / increment) * increment
  return roundedNumber(Math.min(range.max, Math.max(range.min, snapped)))
}

export type {UiFieldsNumberScrubSnapNumberValue} from "./contract"
