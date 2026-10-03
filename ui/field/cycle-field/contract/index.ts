import type {CycleFieldDensity} from "./types.ts"
import type {CycleFieldOption} from "./types.ts"

import type {JSX} from "@jsx-compiler/session"
import type {UiFields} from "@ui/fields/contract"

/** Собственный протокол поля и общие гарантии его группы. */
export declare namespace UiFieldsCycleField {
  /**
  Входные данные CycleField.
  */
  interface Input extends UiFields.Input {
    readonly value: string
    readonly options: readonly CycleFieldOption[]
    readonly density?: CycleFieldDensity | undefined
    readonly disabled?: boolean | undefined
    readonly readOnly?: boolean | undefined
    readonly open?: boolean | undefined
    readonly onChange?: ((value: string, event: Event) => void) | undefined
    readonly onOpenChange?: ((open: boolean, event: Event) => void) | undefined
  }

  type Output = UiFields.Output & JSX.Element
}
