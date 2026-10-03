import type {UiFieldsColorPickerField} from "../contract"
import type {UiFieldsColorValueColorValueToHsva} from "@ui-fields-color-value/color-value-to-hsva"

type ColorPickerFieldProps = UiFieldsColorPickerField.Input
type ColorHsva = UiFieldsColorValueColorValueToHsva.Output

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
