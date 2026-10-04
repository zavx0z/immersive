import type {ImmersiveUiFieldNumberValueNormalize} from "@immersive-ui-field-number-value/normalize"
type NumberValueOptions = NonNullable<ImmersiveUiFieldNumberValueNormalize.Input[1]>


/** Определение мягкого числового диапазона. */
export declare namespace ImmersiveUiFieldNumberValueSoftRange {
  /** Аргументы публичной операции resolveNumberSoftRange; порядок сохраняет её форму вызова. */
  type Input = readonly [
    value: number,
    options?: NumberValueOptions
  ]

  /** Результат публичной операции. */
  type Output = Readonly<{min: number, max: number}>
}
