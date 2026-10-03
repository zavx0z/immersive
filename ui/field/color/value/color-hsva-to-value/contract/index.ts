import type {UiFieldsColorValueNormalizeColorValue} from "@ui-fields-color-value/normalize-color-value"
import type {UiFieldsColorValueColorValueToHsva} from "@ui-fields-color-value/color-value-to-hsva"

/** Преобразует частичный HSVA-цвет в нормализованный неизменяемый RGBA-цвет. */
export declare namespace UiFieldsColorValueColorHsvaToValue {
  type Input = readonly [value: Partial<UiFieldsColorValueColorValueToHsva.Output>]
  type Output = UiFieldsColorValueNormalizeColorValue.Output
}
