

/** Аргументы публичной операции updateMatrixValue; порядок сохраняет её форму вызова. */
export type UpdateMatrixValueInput = readonly [
  matrix: readonly (readonly number[])[],
  rowIndex: number,
  columnIndex: number,
  next: number
]
