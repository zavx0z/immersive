/** Сохраняет конечную числовую границу либо возвращает переданное запасное значение. */
export declare namespace UiFieldsNumberValueFiniteBound {
  /** Аргументы публичной операции finiteBound; порядок сохраняет её форму вызова. */
  type Input = readonly [
    value: number | undefined,
    fallback: number
  ]

  /** Результат публичной операции. */
  type Output = number
}
