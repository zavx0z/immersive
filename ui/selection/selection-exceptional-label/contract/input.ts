import type {SelectionOptionShape} from "@ui-selection/validate-selection-options"
import type {SelectionState} from "@ui-selection/validate-selection-options"

/** Аргументы публичной операции selectionExceptionalLabel; порядок сохраняет её форму вызова. */
export type SelectionExceptionalLabelInput = readonly [
  state: SelectionState | undefined,
  options: readonly SelectionOptionShape[] | undefined
]
