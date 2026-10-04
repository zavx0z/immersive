import type {ImmersiveUiFieldColorValueNormalize} from "@zavx0z/immersive-ui-field-color-value-normalize"
type ColorValue = ImmersiveUiFieldColorValueNormalize.Output

/** Нормализует цвет и форматирует его как HEX со включаемым альфа-каналом. */
export declare namespace ImmersiveUiFieldColorValueFormat {
  /** Аргументы публичной операции formatColorValue; порядок сохраняет её форму вызова. */
  type Input = readonly [
    value: Partial<ColorValue>,
    includeAlpha?: boolean
  ]

  /** Результат публичной операции. */
  type Output = string
}
