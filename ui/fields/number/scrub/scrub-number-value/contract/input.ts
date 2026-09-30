import type {NumberValueOptions} from "@ui-fields-number-value/normalize-number-value"

/** Аргументы публичной операции scrubNumberValue; порядок сохраняет её форму вызова. */
export type ScrubNumberValueInput = readonly [
  value: number,
  deltaX: number,
  distanceX: number,
  options?: NumberValueOptions,
  shift?: boolean,
  ctrl?: boolean
]
