/**
Вычисляет базовую высоту матрицы размером от 2×2 до 4×4 с промежутками между строками.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {Zavx0zImmersiveUiFieldMetricMatrixHeight as Contract} from "./contract"
import type {Zavx0zImmersiveUiFieldMetricResolveDensity} from "@zavx0z/immersive-ui-field-metric-resolve-density"
type FieldDensity = Zavx0zImmersiveUiFieldMetricResolveDensity.Output
import fieldDensityHeight from "@zavx0z/immersive-ui-field-metric-density-height"
import fieldMetric from "@zavx0z/immersive-ui-field-metric-read"

export default function matrixFieldHeight(size: Contract.Input[0], density: Contract.Input[1]): Contract.Output {
  if (!Number.isInteger(size) || size < 2 || size > 4) {
    throw new RangeError("MatrixField layout size must be an integer from 2 to 4")
  }
  return size * fieldDensityHeight(density) + (size - 1) * fieldMetric("field-matrix-row-gap")
}

export type {Zavx0zImmersiveUiFieldMetricMatrixHeight} from "./contract"
