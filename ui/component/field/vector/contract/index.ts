import type {VectorFieldDensity} from "./types.ts"

import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
import type {Zavx0zImmersiveUiComponentField} from "@zavx0z/immersive-ui-component-field/contract"

/** Собственный протокол поля и общие гарантии его группы. */
export declare namespace Zavx0zImmersiveUiComponentFieldVector {
  /**
  Входные данные VectorField.
  */
  interface Input extends Zavx0zImmersiveUiComponentField.Input {
    readonly value: readonly number[]
    readonly axes?: readonly string[] | undefined
    readonly min?: number | undefined
    readonly max?: number | undefined
    readonly step?: number | undefined
    readonly density?: VectorFieldDensity | undefined
    readonly disabled?: boolean | undefined
    readonly readOnly?: boolean | undefined
    readonly onInput?: ((value: readonly number[], event: Event) => void) | undefined
    readonly onChange?: ((value: readonly number[], event: Event) => void) | undefined
  }

  type Output = Zavx0zImmersiveUiComponentField.Output & JSX.Element
}
