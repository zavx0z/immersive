import type {SelectFieldDensity} from "./types.ts"
import type {SelectFieldOption} from "./types.ts"
import type {SelectFieldState} from "./types.ts"

import type {JSX} from "@jsx-compiler/session"
import type {UiFields} from "@ui/fields/contract"

/** Собственный протокол поля и общие гарантии его группы. */
export declare namespace UiFieldsSelectField {
  /**
  Входные данные SelectField.
  */
  interface Input extends UiFields.Input {
    readonly value: string
    readonly options?: readonly SelectFieldOption[] | undefined
    readonly state?: SelectFieldState | undefined
    readonly density?: SelectFieldDensity | undefined
    readonly disabled?: boolean | undefined
    readonly readOnly?: boolean | undefined
    readonly onChange?: ((value: string, event: Event) => void) | undefined
  }

  type Output = UiFields.Output & JSX.Element
}
