/**
Учитывает базовую высоту подписи при планировании строки поля.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {UiFieldsMetricsLabelledFieldHeight as Contract} from "./contract"
import fieldMetric from "@ui-fields-metrics/field-metric"

export default function labelledFieldHeight(controlHeight: Contract.Input[0], labelled: Contract.Input[1] = false): Contract.Output {
  return labelled
    ? Math.max(controlHeight, fieldMetric("field-label-height"))
    : controlHeight
}

export type {UiFieldsMetricsLabelledFieldHeight} from "./contract"
