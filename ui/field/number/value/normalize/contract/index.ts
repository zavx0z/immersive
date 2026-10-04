import type {NumberValueOptions} from "./types"


/** Нормализация числового значения. */
export declare namespace ImmersiveUiFieldNumberValueNormalize {
  /** Аргументы публичной операции normalizeNumberValue; порядок сохраняет её форму вызова. */
  type Input = readonly [
    value: number,
    options?: NumberValueOptions
  ]

  /** Результат публичной операции. */
  type Output = number
}
