import type {SelectionState} from "@ui-selection/validate-selection-options"

/** Аргументы публичной операции validateSelectionState; порядок сохраняет её форму вызова. */
export type ValidateSelectionStateInput = readonly [
  state: SelectionState | undefined
]
