import type {ImmersiveUiFieldNumberValueNormalize} from "@zavx0z/immersive-ui-field-number-value-normalize"
type NumberValueOptions = NonNullable<ImmersiveUiFieldNumberValueNormalize.Input[1]>

/** Выбирает допустимый шаг числового указателя, используя 0.1 при отсутствии корректного шага. */
export declare namespace ImmersiveUiFieldNumberValuePointerStep {
  /** Аргументы публичной операции numberPointerStep; порядок сохраняет её форму вызова. */
  type Input = readonly [
    options: NumberValueOptions
  ]

  /** Результат публичной операции. */
  type Output = number
}
