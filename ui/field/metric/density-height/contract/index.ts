import type {Zavx0zImmersiveUiFieldMetricResolveDensity} from "@zavx0z/immersive-ui-field-metric-resolve-density"
type FieldDensity = Zavx0zImmersiveUiFieldMetricResolveDensity.Output

/** Читает базовую высоту поля для выбранной плотности из числовой темы. */
export declare namespace Zavx0zImmersiveUiFieldMetricDensityHeight {
  /** Аргументы публичной операции fieldDensityHeight; порядок сохраняет её форму вызова. */
  type Input = readonly [
    density: FieldDensity
  ]

  /** Результат публичной операции. */
  type Output = number
}
