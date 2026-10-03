import type {ColorFieldValue} from "./types.ts"

import type {JSX} from "@jsx-compiler/session"
import type {UiFields} from "@ui/fields/contract"

/** Собственный протокол поля и общие гарантии его группы. */
export declare namespace UiFieldsColorField {
  /**
  Входные данные ColorField.
  */
  interface Input extends UiFields.Input {
    readonly value: ColorFieldValue
    readonly open?: boolean | undefined
    readonly disabled?: boolean | undefined
    readonly readOnly?: boolean | undefined
    readonly onInput?: ((value: ColorFieldValue, event: Event) => void) | undefined
    readonly onChange?: ((value: ColorFieldValue, event: Event) => void) | undefined
    readonly onOpenChange?: ((open: boolean, event: Event) => void) | undefined
  }

  type Output = UiFields.Output & JSX.Element
}
