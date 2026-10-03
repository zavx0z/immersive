import type {UiFieldsNumberValueNormalizeNumberValue} from "@ui-fields-number-value/normalize-number-value"
type NumberValueOptions = NonNullable<UiFieldsNumberValueNormalizeNumberValue.Input[1]>

/** Определяет адаптивный диапазон указателя по ограниченному сверху шагу числа. */
export declare namespace UiFieldsNumberValueNumberPointerAdaptiveSpan {
  /** Аргументы публичной операции numberPointerAdaptiveSpan; порядок сохраняет её форму вызова. */
  type Input = readonly [
    options: NumberValueOptions
  ]

  /** Результат публичной операции. */
  type Output = number
}
