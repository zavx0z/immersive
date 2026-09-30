import type fieldMetrics from "@ui/themes/field-metrics.json"

/** Аргументы публичной операции fieldMetric; порядок сохраняет её форму вызова. */
export type FieldMetricInput = readonly [
  name: keyof typeof fieldMetrics
]
