import type {ReferenceFieldDensity} from "./types.ts"
import type {ReferenceFieldValue} from "./types.ts"

/**
Входные данные ReferenceField.
*/
export interface ReferenceFieldProps {
  readonly label?: string | undefined
  readonly value: ReferenceFieldValue | null
  readonly placeholder?: string | undefined
  readonly disabled?: boolean | undefined
  readonly readOnly?: boolean | undefined
  readonly density?: ReferenceFieldDensity | undefined
  readonly title?: string | undefined
  readonly style?: CssStyle | undefined
  readonly onActivate?: ((event: Event) => void) | undefined
  readonly onPick?: ((event: Event) => void) | undefined
  readonly onClear?: ((event: Event) => void) | undefined
}
