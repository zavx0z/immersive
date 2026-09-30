import type {TextFieldInputEvent} from "./types.ts"
import type {TextFieldType} from "./types.ts"

/**
Входные данные TextField.
*/
export interface TextFieldProps {
  readonly label?: string | undefined
  readonly value: string
  readonly type?: TextFieldType | undefined
  readonly placeholder?: string | undefined
  readonly disabled?: boolean | undefined
  readonly readOnly?: boolean | undefined
  readonly title?: string | undefined
  readonly style?: CssStyle | undefined
  readonly onInput?: ((value: string, event: TextFieldInputEvent) => void) | undefined
  readonly onChange?: ((value: string, event: Event) => void) | undefined
}
