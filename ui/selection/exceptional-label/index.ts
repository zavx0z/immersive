/**
Обработка selection-exceptional-label.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {UiSelectionSelectionExceptionalLabel as Contract} from "./contract"
import type {UiSelectionValidateSelectionOptions} from "@ui-selection/validate-selection-options"
type SelectionOptionShape = UiSelectionValidateSelectionOptions.Input[0][number]
import type {UiSelectionValidateSelectionState} from "@ui-selection/validate-selection-state"
type SelectionState = NonNullable<UiSelectionValidateSelectionState.Input[0]>

export default function selectionExceptionalLabel(
  state: Contract.Input[0],
  options: Contract.Input[1]
): Contract.Output {
  if (state === "error") return "Menu Error"
  if (state === "undefined" || options === undefined) return "Menu Undefined"
  if (options.length === 0) return "No Items"
  return undefined
}

export type {UiSelectionSelectionExceptionalLabel} from "./contract"
