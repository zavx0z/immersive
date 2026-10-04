/**
Читает базовую высоту поля для выбранной плотности из числовой темы.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiFieldMetricDensityHeight as Contract} from "./contract"
import type {ImmersiveUiFieldMetricResolveDensity} from "@immersive-ui-field-metric/resolve-density"
type FieldDensity = ImmersiveUiFieldMetricResolveDensity.Output
import fieldMetric from "@immersive-ui-field-metric/read"

export default function fieldDensityHeight(density: Contract.Input[0]): Contract.Output {
  return fieldMetric(`field-height-${density}`)
}

export type {ImmersiveUiFieldMetricDensityHeight} from "./contract"
