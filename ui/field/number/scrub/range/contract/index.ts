import type {ImmersiveUiFieldNumberValueNormalize} from "@immersive-ui-field-number-value/normalize"
type NumberValueOptions = NonNullable<ImmersiveUiFieldNumberValueNormalize.Input[1]>

import type {ImmersiveUiFieldNumberValueSoftRange} from "@immersive-ui-field-number-value/soft-range"

/** Определение диапазона числового перетаскивания. */
export declare namespace ImmersiveUiFieldNumberScrubRange {
  /** Аргументы публичной операции resolveNumberDragRange; порядок сохраняет её форму вызова. */
  type Input = readonly [
    value: number,
    options: NumberValueOptions
  ]

  /** Результат публичной операции. */
  type Output = ImmersiveUiFieldNumberValueSoftRange.Output
}
