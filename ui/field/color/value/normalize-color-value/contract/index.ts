/** Нормализует частичный RGBA-цвет и возвращает неизменяемые каналы от 0 до 1. */
export declare namespace UiFieldsColorValueNormalizeColorValue {
  /** Недостающие RGB-каналы становятся нулевыми, альфа по умолчанию равна единице. */
  type Input = readonly [value: Partial<Output>]

  /** Неизменяемый RGBA-цвет с каналами от 0 до 1. */
  interface Output {
    readonly r: number
    readonly g: number
    readonly b: number
    readonly a: number
  }
}
