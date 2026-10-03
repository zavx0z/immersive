import type {FieldDensity} from "@ui-fields-metrics/resolve-field-density"

/** Вычисляет базовую высоту матрицы размером от 2×2 до 4×4 с промежутками между строками. */
export declare namespace UiFieldsMetricsMatrixFieldHeight {
  /** Аргументы публичной операции matrixFieldHeight; порядок сохраняет её форму вызова. */
  type Input = readonly [
    size: number,
    density: FieldDensity
  ]

  /** Результат публичной операции. */
  type Output = number
}
