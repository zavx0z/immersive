

/** Проверка состояния выбора. */
export declare namespace ImmersiveUiSelectionValidateState {
  /** Аргументы публичной операции validateSelectionState; порядок сохраняет её форму вызова. */
  type Input = readonly [
    state: "ready" | "undefined" | "error" | undefined
  ]

  /** Результат публичной операции. */
  type Output = void
}
