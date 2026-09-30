/** Нормализованные значения и положительный шаг; данные результата неизменяемы. */
export interface NormalizeMatrixValueOutput {
  readonly value: readonly (readonly number[])[]
  readonly step: number
}
