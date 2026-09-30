import type {FieldGroupDensity} from "./types.ts"

/**
Входные данные FieldGroup.
*/
export interface FieldGroupProps {
  readonly label?: string | undefined
  readonly density?: FieldGroupDensity | undefined
  readonly title?: string | undefined
  readonly style?: CssStyle | undefined
}
