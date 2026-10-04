import type {Zavx0zImmersiveUiFieldColorValueNormalize} from "@zavx0z/immersive-ui-field-color-value-normalize"

/** Преобразует нормализованный RGBA-цвет в неизменяемое представление HSVA. */
export declare namespace Zavx0zImmersiveUiFieldColorValueToHsva {
  type Input = readonly [value: Partial<Zavx0zImmersiveUiFieldColorValueNormalize.Output>]

  /** Нормализованные тон, насыщенность, яркость и прозрачность. */
  type Output = Readonly<{
    readonly h: number
    readonly s: number
    readonly v: number
    readonly a: number
  }>
}
