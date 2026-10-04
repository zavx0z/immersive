import type {MatrixFieldDensity} from "./types.ts"

import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
import type {ImmersiveUiComponentField} from "@zavx0z/immersive-ui-component-field/contract"

/** Собственный протокол поля и общие гарантии его группы. */
export declare namespace ImmersiveUiComponentFieldMatrix {
  /**
  Входные данные MatrixField.
  */
  interface Input extends ImmersiveUiComponentField.Input {
    readonly value: readonly (readonly number[])[]
    readonly step?: number | undefined
    readonly density?: MatrixFieldDensity | undefined
    readonly disabled?: boolean | undefined
    readonly readOnly?: boolean | undefined
    readonly onInput?: ((value: readonly (readonly number[])[], event: Event) => void) | undefined
    readonly onChange?: ((value: readonly (readonly number[])[], event: Event) => void) | undefined
  }

  type Output = ImmersiveUiComponentField.Output & JSX.Element
}
