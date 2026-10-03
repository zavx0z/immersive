import type {NumberRange} from "@ui-fields-number-value/resolve-number-soft-range"

/** Переводит движение указателя в ограниченное диапазоном число с замедлением при Shift. */
export declare namespace UiFieldsNumberScrubScrubNumberRawValue {
  /** Аргументы публичной операции scrubNumberRawValue; порядок сохраняет её форму вызова. */
  type Input = readonly [
    value: number,
    deltaX: number,
    distanceX: number,
    range: NumberRange,
    shift: boolean
  ]

  /** Результат публичной операции. */
  type Output = number
}
