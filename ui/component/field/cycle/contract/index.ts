import type {CycleFieldDensity} from "./types.ts"
import type {CycleFieldOption} from "./types.ts"

import type {JSX} from "@immersive-jsx-compiler/session"
import type {ImmersiveUiComponentField} from "@immersive-ui-component/field/contract"

/** Собственный протокол поля и общие гарантии его группы. */
export declare namespace ImmersiveUiComponentFieldCycle {
  /**
  Входные данные CycleField.
  */
  interface Input extends ImmersiveUiComponentField.Input {
    readonly value: string
    readonly options: readonly CycleFieldOption[]
    readonly density?: CycleFieldDensity | undefined
    readonly disabled?: boolean | undefined
    readonly readOnly?: boolean | undefined
    readonly open?: boolean | undefined
    readonly onChange?: ((value: string, event: Event) => void) | undefined
    readonly onOpenChange?: ((open: boolean, event: Event) => void) | undefined
  }

  type Output = ImmersiveUiComponentField.Output & JSX.Element
}
