/**
Заменяет совпавшую по координатам ячейку в неизменяемой копии матрицы.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {UiFieldsMatrixValueUpdateMatrixValue as Contract} from "./contract"
export type {UiFieldsMatrixValueUpdateMatrixValue} from "./contract"


export default function updateMatrixValue(
  matrix: Contract.Input[0],
  rowIndex: Contract.Input[1],
  columnIndex: Contract.Input[2],
  next: Contract.Input[3]
): Contract.Output {
  return Object.freeze(matrix.map((row, currentRow) => Object.freeze(
    row.map((entry, currentColumn) => currentRow === rowIndex && currentColumn === columnIndex ? next : entry)
  )))
}
