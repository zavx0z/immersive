import type {ImmersiveUiFieldColorValueNormalize} from "@zavx0z/immersive-ui-field-color-value-normalize"
type ColorValue = ImmersiveUiFieldColorValueNormalize.Output

/** Форматирует цвет как CSS rgba с байтовыми RGB-каналами и альфой до трёх десятичных знаков. */
export declare namespace ImmersiveUiFieldColorValueRgbaCss {
  /** Аргументы публичной операции rgbaCss; порядок сохраняет её форму вызова. */
  type Input = readonly [
    value: ColorValue
  ]

  /** Результат публичной операции. */
  type Output = string
}
