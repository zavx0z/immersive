/** Проверяет координаты, оси и шаг вектора из 2–4 измерений и возвращает неизменяемую копию. */
export declare namespace Zavx0zImmersiveUiFieldVectorValueNormalize {
  /** Аргументы публичной операции normalizeVectorValue; порядок сохраняет её форму вызова. */
  type Input = readonly [
    value: readonly number[],
    axes: readonly string[] | undefined,
    step: number | undefined
  ]

  /** Нормализованные значения и положительный шаг; данные результата неизменяемы. */
  interface Output {
    readonly value: readonly number[]
    readonly axes: readonly string[]
    readonly step: number
  }
}
