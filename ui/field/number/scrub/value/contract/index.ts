import type {UiFieldsNumberValueNormalizeNumberValue} from "@ui-fields-number-value/normalize-number-value"
type NumberValueOptions = NonNullable<UiFieldsNumberValueNormalizeNumberValue.Input[1]>


/** Изменение при перетаскивании числового значения. */
export declare namespace UiFieldsNumberScrubScrubNumberValue {
  /** Аргументы публичной операции scrubNumberValue; порядок сохраняет её форму вызова. */
  type Input = readonly [
    value: number,
    deltaX: number,
    distanceX: number,
    options?: NumberValueOptions,
    shift?: boolean,
    ctrl?: boolean
  ]

  /** Результат публичной операции. */
  type Output = number
}
