import type {ImmersiveUiFieldNumberValueNormalize} from "@zavx0z/immersive-ui-field-number-value-normalize"
type NumberValueOptions = NonNullable<ImmersiveUiFieldNumberValueNormalize.Input[1]>


/** Пошаговое изменение числового значения. */
export declare namespace ImmersiveUiFieldNumberValueStep {
  /** Аргументы публичной операции stepNumberValue; порядок сохраняет её форму вызова. */
  type Input = readonly [
    value: number,
    direction: -1 | 1,
    options?: NumberValueOptions
  ]

  /** Результат публичной операции. */
  type Output = number
}
