import type {NumberValueOptions} from "@ui-fields-number-value/normalize-number-value"

/** Аргументы публичной операции stepNumberValue; порядок сохраняет её форму вызова. */
export type StepNumberValueInput = readonly [
  value: number,
  direction: -1 | 1,
  options?: NumberValueOptions
]
