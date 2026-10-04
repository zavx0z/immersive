import type {Zavx0zImmersiveUiFieldColorValueNormalize} from "@zavx0z/immersive-ui-field-color-value-normalize"
import type {Zavx0zImmersiveUiFieldColorValueToHsva} from "@zavx0z/immersive-ui-field-color-value-to-hsva"

/** Преобразует частичный HSVA-цвет в нормализованный неизменяемый RGBA-цвет. */
export declare namespace Zavx0zImmersiveUiFieldColorValueFromHsva {
  type Input = readonly [value: Partial<Zavx0zImmersiveUiFieldColorValueToHsva.Output>]
  type Output = Zavx0zImmersiveUiFieldColorValueNormalize.Output
}
