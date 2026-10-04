import type {ImmersiveUiFieldMetricResolveDensity} from "@immersive-ui-field-metric/resolve-density"
type FieldDensity = ImmersiveUiFieldMetricResolveDensity.Output

/** Вычисляет базовую высоту матрицы размером от 2×2 до 4×4 с промежутками между строками. */
export declare namespace ImmersiveUiFieldMetricMatrixHeight {
  /** Аргументы публичной операции matrixFieldHeight; порядок сохраняет её форму вызова. */
  type Input = readonly [
    size: number,
    density: FieldDensity
  ]

  /** Результат публичной операции. */
  type Output = number
}
