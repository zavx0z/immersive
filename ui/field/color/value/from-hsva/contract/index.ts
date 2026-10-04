import type {ImmersiveUiFieldColorValueNormalize} from "@immersive-ui-field-color-value/normalize"
import type {ImmersiveUiFieldColorValueToHsva} from "@immersive-ui-field-color-value/to-hsva"

/** Преобразует частичный HSVA-цвет в нормализованный неизменяемый RGBA-цвет. */
export declare namespace ImmersiveUiFieldColorValueFromHsva {
  type Input = readonly [value: Partial<ImmersiveUiFieldColorValueToHsva.Output>]
  type Output = ImmersiveUiFieldColorValueNormalize.Output
}
