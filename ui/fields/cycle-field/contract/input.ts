import type {CycleFieldDensity} from "./types.ts"
import type {CycleFieldOption} from "./types.ts"

/**
Входные данные CycleField.
*/
export interface CycleFieldProps {
  readonly label?: string | undefined
  readonly value: string
  readonly options: readonly CycleFieldOption[]
  readonly density?: CycleFieldDensity | undefined
  readonly disabled?: boolean | undefined
  readonly readOnly?: boolean | undefined
  readonly open?: boolean | undefined
  readonly title?: string | undefined
  readonly style?: CssStyle | undefined
  readonly onChange?: ((value: string, event: Event) => void) | undefined
  readonly onOpenChange?: ((open: boolean, event: Event) => void) | undefined
}
