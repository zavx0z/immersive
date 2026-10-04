/**
Читает базовую высоту поля для выбранной плотности из числовой темы.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {Zavx0zImmersiveUiFieldMetricDensityHeight as Contract} from "./contract"
import type {Zavx0zImmersiveUiFieldMetricResolveDensity} from "@zavx0z/immersive-ui-field-metric-resolve-density"
type FieldDensity = Zavx0zImmersiveUiFieldMetricResolveDensity.Output
import fieldMetric from "@zavx0z/immersive-ui-field-metric-read"

export default function fieldDensityHeight(density: Contract.Input[0]): Contract.Output {
  return fieldMetric(`field-height-${density}`)
}

export type {Zavx0zImmersiveUiFieldMetricDensityHeight} from "./contract"
