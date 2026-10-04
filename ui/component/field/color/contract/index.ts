import type {ColorFieldValue} from "./types.ts"

import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
import type {ImmersiveUiComponentField} from "@zavx0z/immersive-ui-component-field/contract"

/** Собственный протокол поля и общие гарантии его группы. */
export declare namespace ImmersiveUiComponentFieldColor {
  /**
  Входные данные ColorField.
  */
  interface Input extends ImmersiveUiComponentField.Input {
    readonly value: ColorFieldValue
    readonly open?: boolean | undefined
    readonly disabled?: boolean | undefined
    readonly readOnly?: boolean | undefined
    readonly onInput?: ((value: ColorFieldValue, event: Event) => void) | undefined
    readonly onChange?: ((value: ColorFieldValue, event: Event) => void) | undefined
    readonly onOpenChange?: ((open: boolean, event: Event) => void) | undefined
  }

  type Output = ImmersiveUiComponentField.Output & JSX.Element
}
