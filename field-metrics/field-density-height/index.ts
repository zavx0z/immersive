/**
Читает базовую высоту поля для выбранной плотности из числовой темы.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {UiFieldsMetricsFieldDensityHeight as Contract} from "./contract"
import type {UiFieldsMetricsResolveFieldDensity} from "@ui-fields-metrics/resolve-field-density"
type FieldDensity = UiFieldsMetricsResolveFieldDensity.Output
import fieldMetric from "@ui-fields-metrics/field-metric"

export default function fieldDensityHeight(density: Contract.Input[0]): Contract.Output {
  return fieldMetric(`field-height-${density}`)
}

export type {UiFieldsMetricsFieldDensityHeight} from "./contract"
