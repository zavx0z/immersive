import type {UiFieldsColorValueNormalizeColorValue} from "@ui-fields-color-value/normalize-color-value"

/** Преобразует нормализованный RGBA-цвет в неизменяемое представление HSVA. */
export declare namespace UiFieldsColorValueColorValueToHsva {
  type Input = readonly [value: Partial<UiFieldsColorValueNormalizeColorValue.Output>]

  /** Нормализованные тон, насыщенность, яркость и прозрачность. */
  interface Output {
    readonly h: number
    readonly s: number
    readonly v: number
    readonly a: number
  }
}
