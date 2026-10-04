import type {ImmersiveUiFieldNumberValueNormalize} from "@immersive-ui-field-number-value/normalize"
type NumberValueOptions = NonNullable<ImmersiveUiFieldNumberValueNormalize.Input[1]>

/** Определяет адаптивный диапазон указателя по ограниченному сверху шагу числа. */
export declare namespace ImmersiveUiFieldNumberValuePointerAdaptiveSpan {
  /** Аргументы публичной операции numberPointerAdaptiveSpan; порядок сохраняет её форму вызова. */
  type Input = readonly [
    options: NumberValueOptions
  ]

  /** Результат публичной операции. */
  type Output = number
}
