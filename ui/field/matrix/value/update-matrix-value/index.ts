/**
Изменение матрицы.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {UpdateMatrixValueInput} from "./contract/input"

export default function updateMatrixValue(
  matrix: UpdateMatrixValueInput[0],
  rowIndex: UpdateMatrixValueInput[1],
  columnIndex: UpdateMatrixValueInput[2],
  next: UpdateMatrixValueInput[3]
): readonly (readonly number[])[] {
  return Object.freeze(matrix.map((row, currentRow) => Object.freeze(
    row.map((entry, currentColumn) => currentRow === rowIndex && currentColumn === columnIndex ? next : entry)
  )))
}

export type {UpdateMatrixValueInput} from "./contract/input"
