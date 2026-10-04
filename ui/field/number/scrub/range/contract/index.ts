import type {Zavx0zImmersiveUiFieldNumberValueNormalize} from "@zavx0z/immersive-ui-field-number-value-normalize"
type NumberValueOptions = NonNullable<Zavx0zImmersiveUiFieldNumberValueNormalize.Input[1]>

import type {Zavx0zImmersiveUiFieldNumberValueSoftRange} from "@zavx0z/immersive-ui-field-number-value-soft-range"

/** Определение диапазона числового перетаскивания. */
export declare namespace Zavx0zImmersiveUiFieldNumberScrubRange {
  /** Аргументы публичной операции resolveNumberDragRange; порядок сохраняет её форму вызова. */
  type Input = readonly [
    value: number,
    options: NumberValueOptions
  ]

  /** Результат публичной операции. */
  type Output = Zavx0zImmersiveUiFieldNumberValueSoftRange.Output
}
