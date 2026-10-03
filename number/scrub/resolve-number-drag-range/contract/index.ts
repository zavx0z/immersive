import type {UiFieldsNumberValueNormalizeNumberValue} from "@ui-fields-number-value/normalize-number-value"
type NumberValueOptions = NonNullable<UiFieldsNumberValueNormalizeNumberValue.Input[1]>

import type {UiFieldsNumberValueResolveNumberSoftRange} from "@ui-fields-number-value/resolve-number-soft-range"

/** Определение диапазона числового перетаскивания. */
export declare namespace UiFieldsNumberScrubResolveNumberDragRange {
  /** Аргументы публичной операции resolveNumberDragRange; порядок сохраняет её форму вызова. */
  type Input = readonly [
    value: number,
    options: NumberValueOptions
  ]

  /** Результат публичной операции. */
  type Output = UiFieldsNumberValueResolveNumberSoftRange.Output
}
