import type {ImmersiveUiFieldColorValueToHsva} from "@zavx0z/immersive-ui-field-color-value-to-hsva"
type ColorHsva = ImmersiveUiFieldColorValueToHsva.Output

/** Переводит тон HSVA в целые градусы, остальные каналы округляет до шести десятичных знаков. */
export declare namespace ImmersiveUiFieldColorValueChannelDisplay {
  /** Аргументы публичной операции colorChannelDisplayValue; порядок сохраняет её форму вызова. */
  type Input = readonly [
    channel: "h" | "s" | "v" | "a",
    value: ColorHsva
  ]

  /** Результат публичной операции. */
  type Output = number
}
