/** Ограничивает значение диапазоном от 0 до 1; неконечное значение заменяет нулём. */
export declare namespace UiFieldsColorValueClampUnit {
  /** Аргументы публичной операции clampUnit; порядок сохраняет её форму вызова. */
  type Input = readonly [
    value: number
  ]

  /** Результат публичной операции. */
  type Output = number
}
