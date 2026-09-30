import type {SliderFieldDensity} from "./types.ts"

/**
Входные данные SliderField.
*/
export interface SliderFieldProps {
  readonly label?: string | undefined
  readonly value: number
  readonly min: number
  readonly max: number
  readonly step?: number | undefined
  readonly density?: SliderFieldDensity | undefined
  readonly disabled?: boolean | undefined
  readonly readOnly?: boolean | undefined
  readonly title?: string | undefined
  readonly style?: CssStyle | undefined
  readonly onInput?: ((value: number, event: Event) => void) | undefined
  readonly onChange?: ((value: number, event: Event) => void) | undefined
}
