import type {SelectFieldDensity} from "./types.ts"
import type {SelectFieldOption} from "./types.ts"
import type {SelectFieldState} from "./types.ts"

import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
import type {ImmersiveUiComponentField} from "@zavx0z/immersive-ui-component-field/contract"

/** Собственный протокол поля и общие гарантии его группы. */
export declare namespace ImmersiveUiComponentFieldSelect {
  /**
  Входные данные SelectField.
  */
  interface Input extends ImmersiveUiComponentField.Input {
    readonly value: string
    readonly options?: readonly SelectFieldOption[] | undefined
    readonly state?: SelectFieldState | undefined
    readonly density?: SelectFieldDensity | undefined
    readonly disabled?: boolean | undefined
    readonly readOnly?: boolean | undefined
    readonly onChange?: ((value: string, event: Event) => void) | undefined
  }

  type Output = ImmersiveUiComponentField.Output & JSX.Element
}
