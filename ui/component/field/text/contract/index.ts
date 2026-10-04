import type {TextFieldInputEvent} from "./types.ts"
import type {TextFieldType} from "./types.ts"

import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
import type {Zavx0zImmersiveUiComponentField} from "@zavx0z/immersive-ui-component-field/contract"

/** Собственный протокол поля и общие гарантии его группы. */
export declare namespace Zavx0zImmersiveUiComponentFieldText {
  /**
  Входные данные TextField.
  */
  interface Input extends Zavx0zImmersiveUiComponentField.Input {
    readonly value: string
    readonly type?: TextFieldType | undefined
    readonly placeholder?: string | undefined
    readonly disabled?: boolean | undefined
    readonly readOnly?: boolean | undefined
    readonly onInput?: ((value: string, event: TextFieldInputEvent) => void) | undefined
    readonly onChange?: ((value: string, event: Event) => void) | undefined
  }

  type Output = Zavx0zImmersiveUiComponentField.Output & JSX.Element
}
