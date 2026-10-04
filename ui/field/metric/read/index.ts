/**
Читает конечную неотрицательную числовую метрику поля по её точному имени.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiFieldMetricRead as Contract} from "./contract"
import fieldMetrics from "@immersive-ui/component/theme/field-metrics.json"

export default function fieldMetric(name: Contract.Input[0]): Contract.Output {
  const value = fieldMetrics[name]
  if (!Number.isFinite(value) || value < 0) {
    throw new TypeError(`UI field metric must be a non-negative finite number: ${name}`)
  }
  return value
}

export type {ImmersiveUiFieldMetricRead} from "./contract"
