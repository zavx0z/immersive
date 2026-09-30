/**
Привязка к шагу числового значения.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {SnapNumberValueInput} from "./contract/input"
import {roundHalfAwayFromZero} from "./src/helpers.ts"
import roundedNumber from "@ui-fields-number-value/rounded-number"
import type {NumberRange} from "@ui-fields-number-value/resolve-number-soft-range"

export default function snapNumberValue(
  value: SnapNumberValueInput[0],
  range: SnapNumberValueInput[1],
  small: SnapNumberValueInput[2] = false
): number {
  if (!Number.isFinite(value) || value === range.min || value === range.max) return value
  const span = range.max - range.min
  if (!Number.isFinite(span) || span <= 0) return value
  const baseIncrement = span < 2.1 ? 0.1 : span < 21 ? 1 : 10
  const increment = baseIncrement * (small ? 0.1 : 1)
  const snapped = roundHalfAwayFromZero(value / increment) * increment
  return roundedNumber(Math.min(range.max, Math.max(range.min, snapped)))
}

export type {SnapNumberValueInput} from "./contract/input"
