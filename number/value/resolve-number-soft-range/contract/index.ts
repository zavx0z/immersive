import type {UiFieldsNumberValueNormalizeNumberValue} from "@ui-fields-number-value/normalize-number-value"
type NumberValueOptions = NonNullable<UiFieldsNumberValueNormalizeNumberValue.Input[1]>


/** Определение мягкого числового диапазона. */
export declare namespace UiFieldsNumberValueResolveNumberSoftRange {
  /** Аргументы публичной операции resolveNumberSoftRange; порядок сохраняет её форму вызова. */
  type Input = readonly [
    value: number,
    options?: NumberValueOptions
  ]

  /** Результат публичной операции. */
  type Output = Readonly<{min: number, max: number}>
}
