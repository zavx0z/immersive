import type {NumberRange} from "@ui-fields-number-value/resolve-number-soft-range"

/** Аргументы публичной операции snapNumberValue; порядок сохраняет её форму вызова. */
export type SnapNumberValueInput = readonly [
  value: number,
  range: NumberRange,
  small?: boolean
]
