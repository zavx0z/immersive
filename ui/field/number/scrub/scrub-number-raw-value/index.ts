/**
Изменение при перетаскивании числового значения при перетаскивании.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ScrubNumberRawValueInput} from "./contract/input"
import type {NumberRange} from "@ui-fields-number-value/resolve-number-soft-range"

export default function scrubNumberRawValue(
  value: ScrubNumberRawValueInput[0],
  deltaX: ScrubNumberRawValueInput[1],
  distanceX: ScrubNumberRawValueInput[2],
  range: ScrubNumberRawValueInput[3],
  shift: ScrubNumberRawValueInput[4]
): number {
  const softSpan = range.max - range.min
  if (softSpan <= 0 || !Number.isFinite(deltaX) || !Number.isFinite(distanceX)) {
    return Math.min(range.max, Math.max(range.min, value))
  }
  let scale = softSpan > 11 ? Math.abs(distanceX) / 500 : 1
  if (shift) scale /= 10
  return Math.min(range.max, Math.max(range.min, value + (deltaX / 500) * scale * softSpan))
}

export type {ScrubNumberRawValueInput} from "./contract/input"
