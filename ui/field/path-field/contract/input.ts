import type {PathFieldDensity} from "./types.ts"

/**
Входные данные PathField.
*/
export interface PathFieldProps {
  readonly label?: string | undefined
  readonly value: string
  readonly placeholder?: string | undefined
  readonly disabled?: boolean | undefined
  readonly readOnly?: boolean | undefined
  readonly density?: PathFieldDensity | undefined
  readonly title?: string | undefined
  readonly browseTitle?: string | undefined
  readonly style?: CssStyle | undefined
  readonly onInput?: ((value: string, event: Event) => void) | undefined
  readonly onChange?: ((value: string, event: Event) => void) | undefined
  readonly onBrowse?: ((event: Event) => void) | undefined
}
