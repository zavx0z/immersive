import type {TextFieldInputEvent} from "./types.ts"
import type {TextFieldType} from "./types.ts"

import type {JSX} from "@jsx-compiler/session"
import type {UiFields} from "@ui/fields/contract"

/** Собственный протокол поля и общие гарантии его группы. */
export declare namespace UiFieldsTextField {
  /**
  Входные данные TextField.
  */
  interface Input extends UiFields.Input {
    readonly value: string
    readonly type?: TextFieldType | undefined
    readonly placeholder?: string | undefined
    readonly disabled?: boolean | undefined
    readonly readOnly?: boolean | undefined
    readonly onInput?: ((value: string, event: TextFieldInputEvent) => void) | undefined
    readonly onChange?: ((value: string, event: Event) => void) | undefined
  }

  type Output = UiFields.Output & JSX.Element
}
