import type {UiFieldsNumberValueNormalizeNumberValue} from "@ui-fields-number-value/normalize-number-value"
type NumberValueOptions = NonNullable<UiFieldsNumberValueNormalizeNumberValue.Input[1]>

/** Выбирает допустимый шаг числового указателя, используя 0.1 при отсутствии корректного шага. */
export declare namespace UiFieldsNumberValueNumberPointerStep {
  /** Аргументы публичной операции numberPointerStep; порядок сохраняет её форму вызова. */
  type Input = readonly [
    options: NumberValueOptions
  ]

  /** Результат публичной операции. */
  type Output = number
}
