import type {UiFieldsNumberValueNormalizeNumberValue} from "@ui-fields-number-value/normalize-number-value"
type NumberValueOptions = NonNullable<UiFieldsNumberValueNormalizeNumberValue.Input[1]>


/** Пошаговое изменение числового значения. */
export declare namespace UiFieldsNumberValueStepNumberValue {
  /** Аргументы публичной операции stepNumberValue; порядок сохраняет её форму вызова. */
  type Input = readonly [
    value: number,
    direction: -1 | 1,
    options?: NumberValueOptions
  ]

  /** Результат публичной операции. */
  type Output = number
}
