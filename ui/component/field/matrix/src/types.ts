import type {Zavx0zImmersiveUiComponentFieldMatrix} from "../contract"

type MatrixFieldProps = Zavx0zImmersiveUiComponentFieldMatrix.Input
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
