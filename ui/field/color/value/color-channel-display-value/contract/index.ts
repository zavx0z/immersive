import type {ColorHsva} from "@ui-fields-color-value/normalize-color-value"

/** Переводит тон HSVA в целые градусы, остальные каналы округляет до шести десятичных знаков. */
export declare namespace UiFieldsColorValueColorChannelDisplayValue {
  /** Аргументы публичной операции colorChannelDisplayValue; порядок сохраняет её форму вызова. */
  type Input = readonly [
    channel: "h" | "s" | "v" | "a",
    value: ColorHsva
  ]

  /** Результат публичной операции. */
  type Output = number
}
