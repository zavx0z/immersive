

import type {JSX} from "@immersive-jsx-compiler/session"
import type {ImmersiveUiComponentField} from "@immersive-ui-component/field/contract"

/** Собственный протокол поля и общие гарантии его группы. */
export declare namespace ImmersiveUiComponentFieldCheckbox {
  /**
  Входные данные CheckboxField.
  */
  interface Input extends ImmersiveUiComponentField.Input {
    readonly checked: boolean
    readonly indeterminate?: boolean | undefined
    readonly disabled?: boolean | undefined
    readonly readOnly?: boolean | undefined
    readonly onChange?: ((checked: boolean, event: Event) => void) | undefined
  }

  type Output = ImmersiveUiComponentField.Output & JSX.Element
}
