import type {PathFieldDensity} from "./types.ts"

import type {JSX} from "@jsx-compiler/session"
import type {UiFields} from "@ui/fields/contract"

/** Собственный протокол поля и общие гарантии его группы. */
export declare namespace UiFieldsPathField {
  /**
  Входные данные PathField.
  */
  interface Input extends UiFields.Input {
    readonly value: string
    readonly placeholder?: string | undefined
    readonly disabled?: boolean | undefined
    readonly readOnly?: boolean | undefined
    readonly density?: PathFieldDensity | undefined
    readonly browseTitle?: string | undefined
    readonly onInput?: ((value: string, event: Event) => void) | undefined
    readonly onChange?: ((value: string, event: Event) => void) | undefined
    readonly onBrowse?: ((event: Event) => void) | undefined
  }

  type Output = UiFields.Output & JSX.Element
}
