import type {Zavx0zImmersiveUiFieldColorValueNormalize} from "@zavx0z/immersive-ui-field-color-value-normalize"
type ColorValue = Zavx0zImmersiveUiFieldColorValueNormalize.Output

/** Нормализует цвет и форматирует его как HEX со включаемым альфа-каналом. */
export declare namespace Zavx0zImmersiveUiFieldColorValueFormat {
  /** Аргументы публичной операции formatColorValue; порядок сохраняет её форму вызова. */
  type Input = readonly [
    value: Partial<ColorValue>,
    includeAlpha?: boolean
  ]

  /** Результат публичной операции. */
  type Output = string
}
