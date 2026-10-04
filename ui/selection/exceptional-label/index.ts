/**
Обработка selection-exceptional-label.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiSelectionExceptionalLabel as Contract} from "./contract"
import type {ImmersiveUiSelectionValidateOptions} from "@zavx0z/immersive-ui-selection-validate-options"
type SelectionOptionShape = ImmersiveUiSelectionValidateOptions.Input[0][number]
import type {ImmersiveUiSelectionValidateState} from "@zavx0z/immersive-ui-selection-validate-state"
type SelectionState = NonNullable<ImmersiveUiSelectionValidateState.Input[0]>

export default function selectionExceptionalLabel(
  state: Contract.Input[0],
  options: Contract.Input[1]
): Contract.Output {
  if (state === "error") return "Menu Error"
  if (state === "undefined" || options === undefined) return "Menu Undefined"
  if (options.length === 0) return "No Items"
  return undefined
}

export type {ImmersiveUiSelectionExceptionalLabel} from "./contract"
