import type {Zavx0zImmersiveUiFieldNumberValueSoftRange} from "@zavx0z/immersive-ui-field-number-value-soft-range"
type NumberRange = Zavx0zImmersiveUiFieldNumberValueSoftRange.Output

/** Переводит движение указателя в ограниченное диапазоном число с замедлением при Shift. */
export declare namespace Zavx0zImmersiveUiFieldNumberScrubRaw {
  /** Аргументы публичной операции scrubNumberRawValue; порядок сохраняет её форму вызова. */
  type Input = readonly [
    value: number,
    deltaX: number,
    distanceX: number,
    range: NumberRange,
    shift: boolean
  ]

  /** Результат публичной операции. */
  type Output = number
}
