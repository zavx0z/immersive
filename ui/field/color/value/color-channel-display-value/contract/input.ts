import type {ColorHsva} from "@ui-fields-color-value/normalize-color-value"

/** Аргументы публичной операции colorChannelDisplayValue; порядок сохраняет её форму вызова. */
export type ColorChannelDisplayValueInput = readonly [
  channel: "h" | "s" | "v" | "a",
  value: ColorHsva
]
