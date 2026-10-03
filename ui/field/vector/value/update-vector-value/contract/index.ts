/** Заменяет совпавшую по индексу координату в неизменяемой копии вектора. */
export declare namespace UiFieldsVectorValueUpdateVectorValue {
  /** Аргументы публичной операции updateVectorValue; порядок сохраняет её форму вызова. */
  type Input = readonly [
    value: readonly number[],
    index: number,
    next: number
  ]

  type Output = readonly number[]
}
