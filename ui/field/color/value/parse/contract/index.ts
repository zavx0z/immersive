import type {ImmersiveUiFieldColorValueNormalize} from "@zavx0z/immersive-ui-field-color-value-normalize"

/** Разбирает шестизначный или восьмизначный HEX-цвет, возвращая RGBA либо null. */
export declare namespace ImmersiveUiFieldColorValueParse {
  type Input = readonly [value: string]
  /** Некорректная шестизначная или восьмизначная HEX-запись возвращает null. */
  type Output = ImmersiveUiFieldColorValueNormalize.Output | null
}
