import type {ImmersiveUiSelectionValidateOptions} from "@zavx0z/immersive-ui-selection-validate-options"
type SelectionOptionShape = ImmersiveUiSelectionValidateOptions.Input[0][number]
import type {ImmersiveUiSelectionValidateState} from "@zavx0z/immersive-ui-selection-validate-state"
type SelectionState = NonNullable<ImmersiveUiSelectionValidateState.Input[0]>


/** Обработка selection-exceptional-label. */
export declare namespace ImmersiveUiSelectionExceptionalLabel {
  /** Аргументы публичной операции selectionExceptionalLabel; порядок сохраняет её форму вызова. */
  type Input = readonly [
    state: SelectionState | undefined,
    options: readonly SelectionOptionShape[] | undefined
  ]

  /** Результат публичной операции. */
  type Output = string | undefined
}
