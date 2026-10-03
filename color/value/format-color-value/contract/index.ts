import type {UiFieldsColorValueNormalizeColorValue} from "@ui-fields-color-value/normalize-color-value"
type ColorValue = UiFieldsColorValueNormalizeColorValue.Output

/** Нормализует цвет и форматирует его как HEX со включаемым альфа-каналом. */
export declare namespace UiFieldsColorValueFormatColorValue {
  /** Аргументы публичной операции formatColorValue; порядок сохраняет её форму вызова. */
  type Input = readonly [
    value: Partial<ColorValue>,
    includeAlpha?: boolean
  ]

  /** Результат публичной операции. */
  type Output = string
}
