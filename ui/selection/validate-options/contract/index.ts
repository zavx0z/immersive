import type {SelectionOptionShape} from "./types.ts"


/** Проверка вариантов выбора. */
export declare namespace Zavx0zImmersiveUiSelectionValidateOptions {
  /** Аргументы публичной операции validateSelectionOptions; порядок сохраняет её форму вызова. */
  type Input<T extends SelectionOptionShape = SelectionOptionShape> = readonly [
    options: readonly T[]
  ]

  /** Результат публичной операции. */
  type Output<T extends SelectionOptionShape = SelectionOptionShape> = readonly T[]
}
