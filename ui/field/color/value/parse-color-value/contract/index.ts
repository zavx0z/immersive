import type {UiFieldsColorValueNormalizeColorValue} from "@ui-fields-color-value/normalize-color-value"

/** Разбирает шестизначный или восьмизначный HEX-цвет, возвращая RGBA либо null. */
export declare namespace UiFieldsColorValueParseColorValue {
  type Input = readonly [value: string]
  /** Некорректная шестизначная или восьмизначная HEX-запись возвращает null. */
  type Output = UiFieldsColorValueNormalizeColorValue.Output | null
}
