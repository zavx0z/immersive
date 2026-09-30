

/**
Входные данные CheckboxField.
*/
export interface CheckboxFieldProps {
  readonly label?: string | undefined
  readonly checked: boolean
  readonly indeterminate?: boolean | undefined
  readonly disabled?: boolean | undefined
  readonly readOnly?: boolean | undefined
  readonly title?: string | undefined
  readonly style?: CssStyle | undefined
  readonly onChange?: ((checked: boolean, event: Event) => void) | undefined
}
