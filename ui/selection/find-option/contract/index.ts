import type {ImmersiveUiSelectionValidateOptions} from "@zavx0z/immersive-ui-selection-validate-options"
type SelectionOptionShape = ImmersiveUiSelectionValidateOptions.Input[0][number]


/** Поиск варианта выбора. */
export declare namespace ImmersiveUiSelectionFindOption {
  /** Аргументы публичной операции findSelectionOption; порядок сохраняет её форму вызова. */
  type Input<T extends SelectionOptionShape = SelectionOptionShape> = readonly [
    value: string,
    options: readonly T[]
  ]

  /** Результат публичной операции. */
  type Output<T extends SelectionOptionShape = SelectionOptionShape> = T | undefined
}
