import type {ToggleButtonGroupDensity} from "./types.ts"
import type {ToggleButtonGroupOption} from "./types.ts"

/**
Входные данные ToggleButtonGroup.
*/
export interface ToggleButtonGroupProps {
  readonly label?: string | undefined
  readonly value: string
  readonly options: readonly ToggleButtonGroupOption[]
  readonly density?: ToggleButtonGroupDensity | undefined
  readonly disabled?: boolean | undefined
  readonly readOnly?: boolean | undefined
  readonly title?: string | undefined
  readonly style?: CssStyle | undefined
  readonly onChange?: ((value: string, event: Event) => void) | undefined
}
