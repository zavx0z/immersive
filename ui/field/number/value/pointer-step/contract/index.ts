import type {Zavx0zImmersiveUiFieldNumberValueNormalize} from "@zavx0z/immersive-ui-field-number-value-normalize"
type NumberValueOptions = NonNullable<Zavx0zImmersiveUiFieldNumberValueNormalize.Input[1]>

/** Выбирает допустимый шаг числового указателя, используя 0.1 при отсутствии корректного шага. */
export declare namespace Zavx0zImmersiveUiFieldNumberValuePointerStep {
  /** Аргументы публичной операции numberPointerStep; порядок сохраняет её форму вызова. */
  type Input = readonly [
    options: NumberValueOptions
  ]

  /** Результат публичной операции. */
  type Output = number
}
