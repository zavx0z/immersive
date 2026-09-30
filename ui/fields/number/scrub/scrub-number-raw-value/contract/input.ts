import type {NumberRange} from "@ui-fields-number-value/resolve-number-soft-range"

/** Аргументы публичной операции scrubNumberRawValue; порядок сохраняет её форму вызова. */
export type ScrubNumberRawValueInput = readonly [
  value: number,
  deltaX: number,
  distanceX: number,
  range: NumberRange,
  shift: boolean
]
