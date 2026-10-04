import type fieldMetrics from "@zavx0z/immersive-ui-component/theme/field-metrics.json"

/** Читает конечную неотрицательную числовую метрику поля по её точному имени. */
export declare namespace Zavx0zImmersiveUiFieldMetricRead {
  /** Аргументы публичной операции fieldMetric; порядок сохраняет её форму вызова. */
  type Input = readonly [
    name: keyof typeof fieldMetrics
  ]

  /** Результат публичной операции. */
  type Output = number
}
