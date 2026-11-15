import type {ImmersiveUiFieldNumberValueNormalize} from "@zavx0z/immersive-ui-field-number-value-normalize"
type NumberValueOptions = NonNullable<ImmersiveUiFieldNumberValueNormalize.Input[1]>

/** Выбирает допустимый шаг числового указателя, используя 0.1 при отсутствии корректного шага. */
export declare namespace ImmersiveUiFieldNumberValueStepPointer {
  /** Настройки числового поля. Из них читается положительный конечный step. */
  type Input = readonly [
    options: NumberValueOptions
  ]

  /** Заданный допустимый шаг либо 0.1. */
  type Output = number
}
