

import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
import type {ImmersiveUiComponentField} from "@zavx0z/immersive-ui-component-field/contract"

/** Собственный протокол поля и общие гарантии его группы. */
export declare namespace ImmersiveUiComponentFieldSwitch {
  /**
  Входные данные SwitchField.
  */
  interface Input extends ImmersiveUiComponentField.Input {
    readonly checked: boolean
    readonly disabled?: boolean | undefined
    readonly readOnly?: boolean | undefined
    readonly onChange?: ((checked: boolean, event: Event) => void) | undefined
  }

  type Output = ImmersiveUiComponentField.Output & JSX.Element
}
