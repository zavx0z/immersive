/**
Чтение числовой метрики поля из единого набора размеров.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {FieldMetricInput} from "./contract/input"
import fieldMetrics from "@ui/themes/field-metrics.json"

export default function fieldMetric(name: FieldMetricInput[0]): number {
  const value = fieldMetrics[name]
  if (!Number.isFinite(value) || value < 0) {
    throw new TypeError(`UI field metric must be a non-negative finite number: ${name}`)
  }
  return value
}

export type {FieldMetricInput} from "./contract/input"
