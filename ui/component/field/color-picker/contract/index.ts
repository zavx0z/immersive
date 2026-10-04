import type {ColorPickerFieldValue} from "./types.ts"

import type {JSX} from "@immersive-jsx-compiler/session"
import type {ImmersiveUiComponentField} from "@immersive-ui-component/field/contract"

/** Собственный протокол поля и общие гарантии его группы. */
export declare namespace ImmersiveUiComponentFieldColorPicker {
  /**
  Входные данные ColorPickerField.
  */
  interface Input extends ImmersiveUiComponentField.Input {
    readonly value: ColorPickerFieldValue
    readonly disabled?: boolean | undefined
    readonly readOnly?: boolean | undefined
    readonly onInput?: ((value: ColorPickerFieldValue, event: Event) => void) | undefined
    readonly onChange?: ((value: ColorPickerFieldValue, event: Event) => void) | undefined
  }

  type Output = ImmersiveUiComponentField.Output & JSX.Element
}
