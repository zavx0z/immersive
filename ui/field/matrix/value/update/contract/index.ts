/** Заменяет совпавшую по координатам ячейку в неизменяемой копии матрицы. */
export declare namespace ImmersiveUiFieldMatrixValueUpdate {
  /** Аргументы публичной операции updateMatrixValue; порядок сохраняет её форму вызова. */
  type Input = readonly [
    matrix: readonly (readonly number[])[],
    rowIndex: number,
    columnIndex: number,
    next: number
  ]

  type Output = readonly (readonly number[])[]
}
