import type {Zavx0zImmersiveUiComponentFieldColorPicker} from "../contract"
import type {Zavx0zImmersiveUiFieldColorValueToHsva} from "@zavx0z/immersive-ui-field-color-value-to-hsva"

type ColorPickerFieldProps = Zavx0zImmersiveUiComponentFieldColorPicker.Input
type ColorHsva = Zavx0zImmersiveUiFieldColorValueToHsva.Output

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
