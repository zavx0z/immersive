import type {ImmersiveUiFieldNumberValueNormalize} from "@immersive-ui-field-number-value/normalize"
type NumberValueOptions = NonNullable<ImmersiveUiFieldNumberValueNormalize.Input[1]>


/** Изменение при перетаскивании числового значения. */
export declare namespace ImmersiveUiFieldNumberScrubValue {
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
