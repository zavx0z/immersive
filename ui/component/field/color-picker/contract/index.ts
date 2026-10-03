import type {ColorPickerFieldValue} from "./types.ts"

import type {JSX} from "@jsx-compiler/session"
import type {UiFields} from "@ui/fields/contract"

/** Собственный протокол поля и общие гарантии его группы. */
export declare namespace UiFieldsColorPickerField {
  /**
  Входные данные ColorPickerField.
  */
  interface Input extends UiFields.Input {
    readonly value: ColorPickerFieldValue
    readonly disabled?: boolean | undefined
    readonly readOnly?: boolean | undefined
    readonly onInput?: ((value: ColorPickerFieldValue, event: Event) => void) | undefined
    readonly onChange?: ((value: ColorPickerFieldValue, event: Event) => void) | undefined
  }

  type Output = UiFields.Output & JSX.Element
}
