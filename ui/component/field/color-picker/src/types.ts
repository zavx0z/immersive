import type {ImmersiveUiComponentFieldColorPicker} from "../contract"
import type {ImmersiveUiFieldColorValueToHsva} from "@immersive-ui-field-color-value/to-hsva"

type ColorPickerFieldProps = ImmersiveUiComponentFieldColorPicker.Input
type ColorHsva = ImmersiveUiFieldColorValueToHsva.Output

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
