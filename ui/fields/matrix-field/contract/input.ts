import type {MatrixFieldDensity} from "./types.ts"

/**
Входные данные MatrixField.
*/
export interface MatrixFieldProps {
  readonly label?: string | undefined
  readonly value: readonly (readonly number[])[]
  readonly step?: number | undefined
  readonly density?: MatrixFieldDensity | undefined
  readonly disabled?: boolean | undefined
  readonly readOnly?: boolean | undefined
  readonly title?: string | undefined
  readonly style?: CssStyle | undefined
  readonly onInput?: ((value: readonly (readonly number[])[], event: Event) => void) | undefined
  readonly onChange?: ((value: readonly (readonly number[])[], event: Event) => void) | undefined
}
