import type {ColorValue} from "@ui-fields-color-value/normalize-color-value"

/** Аргументы публичной операции colorValueToHsva; порядок сохраняет её форму вызова. */
export type ColorValueToHsvaInput = readonly [
  value: Partial<ColorValue>
]
