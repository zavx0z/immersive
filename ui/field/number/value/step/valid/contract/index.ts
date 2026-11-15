


/** Положительный конечный шаг числового поля. */
export declare namespace ImmersiveUiFieldNumberValueStepValid {
  /** Значение шага, требующее проверки конечности и положительности. */
  type Input = readonly [
    value: number | undefined
  ]

  /** Тот же допустимый шаг либо undefined для отсутствующего и некорректного значения. */
  type Output = number | undefined
}
