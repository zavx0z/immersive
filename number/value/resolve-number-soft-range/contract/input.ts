import type {NumberValueOptions} from "@ui-fields-number-value/normalize-number-value"

/** Аргументы публичной операции resolveNumberSoftRange; порядок сохраняет её форму вызова. */
export type ResolveNumberSoftRangeInput = readonly [
  value: number,
  options?: NumberValueOptions
]
