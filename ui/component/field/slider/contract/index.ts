import type {SliderFieldDensity} from "./types.ts"

import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
import type {Zavx0zImmersiveUiComponentField} from "@zavx0z/immersive-ui-component-field/contract"

/** Собственный протокол поля и общие гарантии его группы. */
export declare namespace Zavx0zImmersiveUiComponentFieldSlider {
  /**
  Входные данные SliderField.
  */
  interface Input extends Zavx0zImmersiveUiComponentField.Input {
    readonly value: number
    readonly min: number
    readonly max: number
    readonly step?: number | undefined
    readonly density?: SliderFieldDensity | undefined
    readonly disabled?: boolean | undefined
    readonly readOnly?: boolean | undefined
    readonly onInput?: ((value: number, event: Event) => void) | undefined
    readonly onChange?: ((value: number, event: Event) => void) | undefined
  }

  type Output = Zavx0zImmersiveUiComponentField.Output & JSX.Element
}
