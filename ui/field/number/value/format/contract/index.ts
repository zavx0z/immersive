


/** Представление числового значения. */
export declare namespace ImmersiveUiFieldNumberValueFormat {
  /** Аргументы публичной операции formatNumberValue; порядок сохраняет её форму вызова. */
  type Input = readonly [
    value: number,
    precision: number | undefined
  ]

  /** Результат публичной операции. */
  type Output = number | string
}
