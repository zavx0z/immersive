import type {MatrixFieldDensity} from "./types.ts"

import type {JSX} from "@jsx-compiler/session"
import type {UiFields} from "@ui/fields/contract"

/** Собственный протокол поля и общие гарантии его группы. */
export declare namespace UiFieldsMatrixField {
  /**
  Входные данные MatrixField.
  */
  interface Input extends UiFields.Input {
    readonly value: readonly (readonly number[])[]
    readonly step?: number | undefined
    readonly density?: MatrixFieldDensity | undefined
    readonly disabled?: boolean | undefined
    readonly readOnly?: boolean | undefined
    readonly onInput?: ((value: readonly (readonly number[])[], event: Event) => void) | undefined
    readonly onChange?: ((value: readonly (readonly number[])[], event: Event) => void) | undefined
  }

  type Output = UiFields.Output & JSX.Element
}
