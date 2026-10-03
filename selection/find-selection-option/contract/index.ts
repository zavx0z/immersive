import type {UiSelectionValidateSelectionOptions} from "@ui-selection/validate-selection-options"
type SelectionOptionShape = UiSelectionValidateSelectionOptions.Input[0][number]


/** Поиск варианта выбора. */
export declare namespace UiSelectionFindSelectionOption {
  /** Аргументы публичной операции findSelectionOption; порядок сохраняет её форму вызова. */
  type Input<T extends SelectionOptionShape = SelectionOptionShape> = readonly [
    value: string,
    options: readonly T[]
  ]

  /** Результат публичной операции. */
  type Output<T extends SelectionOptionShape = SelectionOptionShape> = T | undefined
}
