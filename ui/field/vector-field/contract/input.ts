import type {VectorFieldDensity} from "./types.ts"

/**
Входные данные VectorField.
*/
export interface VectorFieldProps {
  readonly label?: string | undefined
  readonly value: readonly number[]
  readonly axes?: readonly string[] | undefined
  readonly min?: number | undefined
  readonly max?: number | undefined
  readonly step?: number | undefined
  readonly density?: VectorFieldDensity | undefined
  readonly disabled?: boolean | undefined
  readonly readOnly?: boolean | undefined
  readonly title?: string | undefined
  readonly style?: CssStyle | undefined
  readonly onInput?: ((value: readonly number[], event: Event) => void) | undefined
  readonly onChange?: ((value: readonly number[], event: Event) => void) | undefined
}
