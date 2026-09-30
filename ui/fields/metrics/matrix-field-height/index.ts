/**
Высота матрицы для её размера и плотности.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {MatrixFieldHeightInput} from "./contract/input"
import type {FieldDensity} from "@ui-fields-metrics/resolve-field-density"
import fieldDensityHeight from "@ui-fields-metrics/field-density-height"
import fieldMetric from "@ui-fields-metrics/field-metric"

export default function matrixFieldHeight(size: MatrixFieldHeightInput[0], density: MatrixFieldHeightInput[1]): number {
  if (!Number.isInteger(size) || size < 2 || size > 4) {
    throw new RangeError("MatrixField layout size must be an integer from 2 to 4")
  }
  return size * fieldDensityHeight(density) + (size - 1) * fieldMetric("field-matrix-row-gap")
}

export type {MatrixFieldHeightInput} from "./contract/input"
