import type {UiFieldsMatrixField} from "../contract"

type MatrixFieldProps = UiFieldsMatrixField.Input
type MatrixFieldDensity = NonNullable<MatrixFieldProps["density"]>

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
