import type {Zavx0zImmersiveUiFieldColorValueToHsva} from "@zavx0z/immersive-ui-field-color-value-to-hsva"
type ColorHsva = Zavx0zImmersiveUiFieldColorValueToHsva.Output

/** Переводит тон HSVA в целые градусы, остальные каналы округляет до шести десятичных знаков. */
export declare namespace Zavx0zImmersiveUiFieldColorValueChannelDisplay {
  /** Аргументы публичной операции colorChannelDisplayValue; порядок сохраняет её форму вызова. */
  type Input = readonly [
    channel: "h" | "s" | "v" | "a",
    value: ColorHsva
  ]

  /** Результат публичной операции. */
  type Output = number
}
