import type {Zavx0zImmersiveUiFieldNumberValueNormalize} from "@zavx0z/immersive-ui-field-number-value-normalize"
type NumberValueOptions = NonNullable<Zavx0zImmersiveUiFieldNumberValueNormalize.Input[1]>


/** Изменение при перетаскивании числового значения. */
export declare namespace Zavx0zImmersiveUiFieldNumberScrubValue {
  /** Аргументы публичной операции scrubNumberValue; порядок сохраняет её форму вызова. */
  type Input = readonly [
    value: number,
    deltaX: number,
    distanceX: number,
    options?: NumberValueOptions,
    shift?: boolean,
    ctrl?: boolean
  ]

  /** Результат публичной операции. */
  type Output = number
}
