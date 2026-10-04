import type {PathFieldDensity} from "./types.ts"

import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
import type {ImmersiveUiComponentField} from "@zavx0z/immersive-ui-component-field/contract"

/** Собственный протокол поля и общие гарантии его группы. */
export declare namespace ImmersiveUiComponentFieldPath {
  /**
  Входные данные PathField.
  */
  interface Input extends ImmersiveUiComponentField.Input {
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

  type Output = ImmersiveUiComponentField.Output & JSX.Element
}
