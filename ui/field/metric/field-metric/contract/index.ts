import type fieldMetrics from "@ui/themes/field-metrics.json"

/** Читает конечную неотрицательную числовую метрику поля по её точному имени. */
export declare namespace UiFieldsMetricsFieldMetric {
  /** Аргументы публичной операции fieldMetric; порядок сохраняет её форму вызова. */
  type Input = readonly [
    name: keyof typeof fieldMetrics
  ]

  /** Результат публичной операции. */
  type Output = number
}
