import type {ColorFieldValue} from "./types.ts"

/**
Входные данные ColorField.
*/
export interface ColorFieldProps {
  readonly label?: string | undefined
  readonly value: ColorFieldValue
  readonly open?: boolean | undefined
  readonly disabled?: boolean | undefined
  readonly readOnly?: boolean | undefined
  readonly title?: string | undefined
  readonly style?: CssStyle | undefined
  readonly onInput?: ((value: ColorFieldValue, event: Event) => void) | undefined
  readonly onChange?: ((value: ColorFieldValue, event: Event) => void) | undefined
  readonly onOpenChange?: ((open: boolean, event: Event) => void) | undefined
}
