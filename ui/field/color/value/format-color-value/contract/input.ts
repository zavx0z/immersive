import type {ColorValue} from "@ui-fields-color-value/normalize-color-value"

/** Аргументы публичной операции formatColorValue; порядок сохраняет её форму вызова. */
export type FormatColorValueInput = readonly [
  value: Partial<ColorValue>,
  includeAlpha?: boolean
]
