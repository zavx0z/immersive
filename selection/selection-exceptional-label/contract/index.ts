import type {UiSelectionValidateSelectionOptions} from "@ui-selection/validate-selection-options"
type SelectionOptionShape = UiSelectionValidateSelectionOptions.Input[0][number]
import type {UiSelectionValidateSelectionState} from "@ui-selection/validate-selection-state"
type SelectionState = NonNullable<UiSelectionValidateSelectionState.Input[0]>


/** Обработка selection-exceptional-label. */
export declare namespace UiSelectionSelectionExceptionalLabel {
  /** Аргументы публичной операции selectionExceptionalLabel; порядок сохраняет её форму вызова. */
  type Input = readonly [
    state: SelectionState | undefined,
    options: readonly SelectionOptionShape[] | undefined
  ]

  /** Результат публичной операции. */
  type Output = string | undefined
}
