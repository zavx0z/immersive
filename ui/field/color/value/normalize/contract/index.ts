/** Нормализует частичный RGBA-цвет и возвращает неизменяемые каналы от 0 до 1. */
export declare namespace Zavx0zImmersiveUiFieldColorValueNormalize {
  /** Недостающие RGB-каналы становятся нулевыми, альфа по умолчанию равна единице. */
  type Input = readonly [value: Partial<Output>]

  /** Неизменяемый RGBA-цвет с каналами от 0 до 1. */
  type Output = Readonly<{
    readonly r: number
    readonly g: number
    readonly b: number
    readonly a: number
  }>
}
