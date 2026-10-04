import type {CycleFieldDensity} from "./types.ts"
import type {CycleFieldOption} from "./types.ts"

import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
import type {Zavx0zImmersiveUiComponentField} from "@zavx0z/immersive-ui-component-field/contract"

/** Собственный протокол поля и общие гарантии его группы. */
export declare namespace Zavx0zImmersiveUiComponentFieldCycle {
  /**
  Входные данные CycleField.
  */
  interface Input extends Zavx0zImmersiveUiComponentField.Input {
    readonly value: string
    readonly options: readonly CycleFieldOption[]
    readonly density?: CycleFieldDensity | undefined
    readonly disabled?: boolean | undefined
    readonly readOnly?: boolean | undefined
    readonly open?: boolean | undefined
    readonly onChange?: ((value: string, event: Event) => void) | undefined
    readonly onOpenChange?: ((open: boolean, event: Event) => void) | undefined
  }

  type Output = Zavx0zImmersiveUiComponentField.Output & JSX.Element
}
