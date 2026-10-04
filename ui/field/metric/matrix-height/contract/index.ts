import type {Zavx0zImmersiveUiFieldMetricResolveDensity} from "@zavx0z/immersive-ui-field-metric-resolve-density"
type FieldDensity = Zavx0zImmersiveUiFieldMetricResolveDensity.Output

/** Вычисляет базовую высоту матрицы размером от 2×2 до 4×4 с промежутками между строками. */
export declare namespace Zavx0zImmersiveUiFieldMetricMatrixHeight {
  /** Аргументы публичной операции matrixFieldHeight; порядок сохраняет её форму вызова. */
  type Input = readonly [
    size: number,
    density: FieldDensity
  ]

  /** Результат публичной операции. */
  type Output = number
}
