import type {ImmersiveUiFieldNumberValueSoftRange} from "@zavx0z/immersive-ui-field-number-value-soft-range"
type NumberRange = ImmersiveUiFieldNumberValueSoftRange.Output

/** Привязывает число к шагу диапазона, сохраняя его граничные и неконечные значения. */
export declare namespace ImmersiveUiFieldNumberScrubSnap {
  /** Аргументы публичной операции snapNumberValue; порядок сохраняет её форму вызова. */
  type Input = readonly [
    value: number,
    range: NumberRange,
    small?: boolean
  ]

  /** Результат публичной операции. */
  type Output = number
}
