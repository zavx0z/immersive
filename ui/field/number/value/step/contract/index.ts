import type {Zavx0zImmersiveUiFieldNumberValueNormalize} from "@zavx0z/immersive-ui-field-number-value-normalize"
type NumberValueOptions = NonNullable<Zavx0zImmersiveUiFieldNumberValueNormalize.Input[1]>


/** Пошаговое изменение числового значения. */
export declare namespace Zavx0zImmersiveUiFieldNumberValueStep {
  /** Аргументы публичной операции stepNumberValue; порядок сохраняет её форму вызова. */
  type Input = readonly [
    value: number,
    direction: -1 | 1,
    options?: NumberValueOptions
  ]

  /** Результат публичной операции. */
  type Output = number
}
