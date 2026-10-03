import type {SliderFieldDensity} from "./types.ts"

import type {JSX} from "@jsx-compiler/session"
import type {UiFields} from "@ui/fields/contract"

/** Собственный протокол поля и общие гарантии его группы. */
export declare namespace UiFieldsSliderField {
  /**
  Входные данные SliderField.
  */
  interface Input extends UiFields.Input {
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

  type Output = UiFields.Output & JSX.Element
}
