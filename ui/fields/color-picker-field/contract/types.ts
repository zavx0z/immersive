import type {ColorPickerFieldProps} from "./input.ts"
import type {ColorHsva} from "@ui-fields-color-value/normalize-color-value"
import type {ColorValue} from "@ui-fields-color-value/normalize-color-value"

/**
Тип ColorPickerFieldValue принадлежит контракту своего владельца.
*/
export type ColorPickerFieldValue = ColorValue

/**
Тип HsvaChannel принадлежит контракту своего владельца.
*/
export type HsvaChannel = "h" | "s" | "v" | "a"

/**
Тип ColorChannelFieldProps принадлежит контракту своего владельца.
*/
export type ColorChannelFieldProps = Readonly<{
  channel: HsvaChannel
  hsva: ColorHsva
  disabled: boolean
  readOnly: boolean
  onInput?: ColorPickerFieldProps["onInput"]
  onChange?: ColorPickerFieldProps["onChange"]
}>
