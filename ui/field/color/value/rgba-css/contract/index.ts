import type {UiFieldsColorValueNormalizeColorValue} from "@ui-fields-color-value/normalize-color-value"
type ColorValue = UiFieldsColorValueNormalizeColorValue.Output

/** Форматирует цвет как CSS rgba с байтовыми RGB-каналами и альфой до трёх десятичных знаков. */
export declare namespace UiFieldsColorValueRgbaCss {
  /** Аргументы публичной операции rgbaCss; порядок сохраняет её форму вызова. */
  type Input = readonly [
    value: ColorValue
  ]

  /** Результат публичной операции. */
  type Output = string
}
