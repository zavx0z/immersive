import type {ColorPickerFieldProps} from "./input.ts"
import type {UiFieldsColorValueColorValueToHsva} from "@ui-fields-color-value/color-value-to-hsva"
type ColorHsva = UiFieldsColorValueColorValueToHsva.Output
import type {UiFieldsColorValueNormalizeColorValue} from "@ui-fields-color-value/normalize-color-value"
type ColorValue = UiFieldsColorValueNormalizeColorValue.Output

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
