

/**
Входные данные NumberField.
*/
export interface NumberFieldProps {
  readonly label?: string | undefined
  readonly value: number
  readonly min?: number | undefined
  readonly max?: number | undefined
  readonly softMin?: number | undefined
  readonly softMax?: number | undefined
  readonly step?: number | undefined
  readonly precision?: number | undefined
  readonly disabled?: boolean | undefined
  readonly readOnly?: boolean | undefined
  readonly title?: string | undefined
  readonly style?: CssStyle | undefined
  readonly onInput?: ((value: number, event: Event) => void) | undefined
  readonly onChange?: ((value: number, event: Event) => void) | undefined
}
