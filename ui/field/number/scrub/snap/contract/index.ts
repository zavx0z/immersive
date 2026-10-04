import type {Zavx0zImmersiveUiFieldNumberValueSoftRange} from "@zavx0z/immersive-ui-field-number-value-soft-range"
type NumberRange = Zavx0zImmersiveUiFieldNumberValueSoftRange.Output

/** Привязывает число к шагу диапазона, сохраняя его граничные и неконечные значения. */
export declare namespace Zavx0zImmersiveUiFieldNumberScrubSnap {
  /** Аргументы публичной операции snapNumberValue; порядок сохраняет её форму вызова. */
  type Input = readonly [
    value: number,
    range: NumberRange,
    small?: boolean
  ]

  /** Результат публичной операции. */
  type Output = number
}
