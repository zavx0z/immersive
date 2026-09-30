import type {SelectFieldDensity} from "./types.ts"
import type {SelectFieldOption} from "./types.ts"
import type {SelectFieldState} from "./types.ts"

/**
Входные данные SelectField.
*/
export interface SelectFieldProps {
  readonly label?: string | undefined
  readonly value: string
  readonly options?: readonly SelectFieldOption[] | undefined
  readonly state?: SelectFieldState | undefined
  readonly density?: SelectFieldDensity | undefined
  readonly disabled?: boolean | undefined
  readonly readOnly?: boolean | undefined
  readonly title?: string | undefined
  readonly style?: CssStyle | undefined
  readonly onChange?: ((value: string, event: Event) => void) | undefined
}
