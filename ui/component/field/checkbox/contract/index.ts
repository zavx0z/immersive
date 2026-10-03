

import type {JSX} from "@jsx-compiler/session"
import type {UiFields} from "@ui/fields/contract"

/** Собственный протокол поля и общие гарантии его группы. */
export declare namespace UiFieldsCheckboxField {
  /**
  Входные данные CheckboxField.
  */
  interface Input extends UiFields.Input {
    readonly checked: boolean
    readonly indeterminate?: boolean | undefined
    readonly disabled?: boolean | undefined
    readonly readOnly?: boolean | undefined
    readonly onChange?: ((checked: boolean, event: Event) => void) | undefined
  }

  type Output = UiFields.Output & JSX.Element
}
