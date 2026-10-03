import type {UiFieldsNumberValueResolveNumberSoftRange} from "@ui-fields-number-value/resolve-number-soft-range"
type NumberRange = UiFieldsNumberValueResolveNumberSoftRange.Output

/** Привязывает число к шагу диапазона, сохраняя его граничные и неконечные значения. */
export declare namespace UiFieldsNumberScrubSnapNumberValue {
  /** Аргументы публичной операции snapNumberValue; порядок сохраняет её форму вызова. */
  type Input = readonly [
    value: number,
    range: NumberRange,
    small?: boolean
  ]

  /** Результат публичной операции. */
  type Output = number
}
