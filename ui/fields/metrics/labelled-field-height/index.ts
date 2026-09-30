/**
Высота поля с учётом подписи.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {LabelledFieldHeightInput} from "./contract/input"
import fieldMetric from "@ui-fields-metrics/field-metric"

export default function labelledFieldHeight(controlHeight: LabelledFieldHeightInput[0], labelled: LabelledFieldHeightInput[1] = false): number {
  return labelled
    ? Math.max(controlHeight, fieldMetric("field-label-height"))
    : controlHeight
}

export type {LabelledFieldHeightInput} from "./contract/input"
