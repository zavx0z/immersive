import type {ImmersiveUiComponentFieldMatrix} from "../contract"

type MatrixFieldProps = ImmersiveUiComponentFieldMatrix.Input
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
