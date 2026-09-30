import type {MatrixFieldProps} from "./input.ts"
import type {FieldGroupDensity} from "@ui-fields/field-group"

/**
Тип MatrixFieldDensity принадлежит контракту своего владельца.
*/
export type MatrixFieldDensity = FieldGroupDensity

/**
Тип MatrixRowProps принадлежит контракту своего владельца.
*/
export type MatrixRowProps = Readonly<{
  row: readonly number[]
  rowIndex: number
  step: number
  matrix: readonly (readonly number[])[]
  density: MatrixFieldDensity
  disabled: boolean
  readOnly: boolean
  onInput?: MatrixFieldProps["onInput"]
  onChange?: MatrixFieldProps["onChange"]
}>
