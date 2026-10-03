

import type {JSX} from "@jsx-compiler/session"
import type {UiFields} from "@ui/fields/contract"

/** Собственный протокол поля и общие гарантии его группы. */
export declare namespace UiFieldsSwitchField {
  /**
  Входные данные SwitchField.
  */
  interface Input extends UiFields.Input {
    readonly checked: boolean
    readonly disabled?: boolean | undefined
    readonly readOnly?: boolean | undefined
    readonly onChange?: ((checked: boolean, event: Event) => void) | undefined
  }

  type Output = UiFields.Output & JSX.Element
}
