import type {ImmersiveUiFieldColorValueNormalize} from "@immersive-ui-field-color-value/normalize"

/** Преобразует нормализованный RGBA-цвет в неизменяемое представление HSVA. */
export declare namespace ImmersiveUiFieldColorValueToHsva {
  type Input = readonly [value: Partial<ImmersiveUiFieldColorValueNormalize.Output>]

  /** Нормализованные тон, насыщенность, яркость и прозрачность. */
  type Output = Readonly<{
    readonly h: number
    readonly s: number
    readonly v: number
    readonly a: number
  }>
}
