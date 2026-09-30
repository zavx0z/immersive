import type {ColorPickerFieldValue} from "./types.ts"

/**
Входные данные ColorPickerField.
*/
export interface ColorPickerFieldProps {
  readonly label?: string | undefined
  readonly value: ColorPickerFieldValue
  readonly disabled?: boolean | undefined
  readonly readOnly?: boolean | undefined
  readonly title?: string | undefined
  readonly style?: CssStyle | undefined
  readonly onInput?: ((value: ColorPickerFieldValue, event: Event) => void) | undefined
  readonly onChange?: ((value: ColorPickerFieldValue, event: Event) => void) | undefined
}
