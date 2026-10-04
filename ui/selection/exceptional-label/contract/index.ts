import type {Zavx0zImmersiveUiSelectionValidateOptions} from "@zavx0z/immersive-ui-selection-validate-options"
type SelectionOptionShape = Zavx0zImmersiveUiSelectionValidateOptions.Input[0][number]
import type {Zavx0zImmersiveUiSelectionValidateState} from "@zavx0z/immersive-ui-selection-validate-state"
type SelectionState = NonNullable<Zavx0zImmersiveUiSelectionValidateState.Input[0]>


/** Обработка selection-exceptional-label. */
export declare namespace Zavx0zImmersiveUiSelectionExceptionalLabel {
  /** Аргументы публичной операции selectionExceptionalLabel; порядок сохраняет её форму вызова. */
  type Input = readonly [
    state: SelectionState | undefined,
    options: readonly SelectionOptionShape[] | undefined
  ]

  /** Результат публичной операции. */
  type Output = string | undefined
}
