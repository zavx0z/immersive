

import type {JSX} from "@jsx-compiler/session"
import type {UiFields} from "@ui/fields/contract"

/** Собственный протокол поля и общие гарантии его группы. */
export declare namespace UiFieldsNumberField {
  /**
  Входные данные NumberField.
  */
  interface Input extends UiFields.Input {
    readonly value: number
    readonly min?: number | undefined
    readonly max?: number | undefined
    readonly softMin?: number | undefined
    readonly softMax?: number | undefined
    readonly step?: number | undefined
    readonly precision?: number | undefined
    readonly disabled?: boolean | undefined
    readonly readOnly?: boolean | undefined
    readonly onInput?: ((value: number, event: Event) => void) | undefined
    readonly onChange?: ((value: number, event: Event) => void) | undefined
  }

  type Output = UiFields.Output & JSX.Element
}
