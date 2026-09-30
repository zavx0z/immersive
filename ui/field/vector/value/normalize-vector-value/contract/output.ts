/** Нормализованные значения и положительный шаг; данные результата неизменяемы. */
export interface NormalizeVectorValueOutput {
  readonly value: readonly number[]
  readonly axes: readonly string[]
  readonly step: number
}
