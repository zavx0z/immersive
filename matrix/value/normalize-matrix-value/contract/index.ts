/** Проверяет квадратную матрицу от 2×2 до 4×4 и положительный шаг, сохраняя неизменяемые строки. */
export declare namespace UiFieldsMatrixValueNormalizeMatrixValue {
  /** Аргументы публичной операции normalizeMatrixValue; порядок сохраняет её форму вызова. */
  type Input = readonly [
    value: readonly (readonly number[])[],
    step: number | undefined
  ]

  /** Нормализованные значения и положительный шаг; данные результата неизменяемы. */
  interface Output {
    readonly value: readonly (readonly number[])[]
    readonly step: number
  }
}
