/**
Высота поля для выбранной плотности.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {FieldDensityHeightInput} from "./contract/input"
import type {FieldDensity} from "@ui-fields-metrics/resolve-field-density"
import fieldMetric from "@ui-fields-metrics/field-metric"

export default function fieldDensityHeight(density: FieldDensityHeightInput[0]): number {
  return fieldMetric(`field-height-${density}`)
}

export type {FieldDensityHeightInput} from "./contract/input"
