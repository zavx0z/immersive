
/** Проверка и выбор плотности размещения поля. */
export declare namespace Zavx0zImmersiveUiFieldMetricResolveDensity {
  /** Аргументы публичной операции resolveOutput; порядок сохраняет её форму вызова. */
  type Input = readonly [
    value: Output | undefined,
    fallback: Output,
    owner: string
  ]

  /** Результат публичной операции. */
  type Output = "regular" | "compact"
}
