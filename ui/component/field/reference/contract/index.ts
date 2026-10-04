import type {ReferenceFieldDensity} from "./types.ts"
import type {ReferenceFieldValue} from "./types.ts"

import type {JSX} from "@immersive-jsx-compiler/session"
import type {ImmersiveUiComponentField} from "@immersive-ui-component/field/contract"

/** Собственный протокол поля и общие гарантии его группы. */
export declare namespace ImmersiveUiComponentFieldReference {
  /**
  Входные данные ReferenceField.
  */
  interface Input extends ImmersiveUiComponentField.Input {
    readonly value: ReferenceFieldValue | null
    readonly placeholder?: string | undefined
    readonly disabled?: boolean | undefined
    readonly readOnly?: boolean | undefined
    readonly density?: ReferenceFieldDensity | undefined
    readonly onActivate?: ((event: Event) => void) | undefined
    readonly onPick?: ((event: Event) => void) | undefined
    readonly onClear?: ((event: Event) => void) | undefined
  }

  type Output = ImmersiveUiComponentField.Output & JSX.Element
}
