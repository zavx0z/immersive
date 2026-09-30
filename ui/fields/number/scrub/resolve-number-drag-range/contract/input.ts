import type {NumberValueOptions} from "@ui-fields-number-value/normalize-number-value"

/** Аргументы публичной операции resolveNumberDragRange; порядок сохраняет её форму вызова. */
export type ResolveNumberDragRangeInput = readonly [
  value: number,
  options: NumberValueOptions
]
