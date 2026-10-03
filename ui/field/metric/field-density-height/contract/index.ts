import type {FieldDensity} from "@ui-fields-metrics/resolve-field-density"

/** Читает базовую высоту поля для выбранной плотности из числовой темы. */
export declare namespace UiFieldsMetricsFieldDensityHeight {
  /** Аргументы публичной операции fieldDensityHeight; порядок сохраняет её форму вызова. */
  type Input = readonly [
    density: FieldDensity
  ]

  /** Результат публичной операции. */
  type Output = number
}
