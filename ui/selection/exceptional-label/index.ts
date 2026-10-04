/**
Обработка selection-exceptional-label.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {Zavx0zImmersiveUiSelectionExceptionalLabel as Contract} from "./contract"
import type {Zavx0zImmersiveUiSelectionValidateOptions} from "@zavx0z/immersive-ui-selection-validate-options"
type SelectionOptionShape = Zavx0zImmersiveUiSelectionValidateOptions.Input[0][number]
import type {Zavx0zImmersiveUiSelectionValidateState} from "@zavx0z/immersive-ui-selection-validate-state"
type SelectionState = NonNullable<Zavx0zImmersiveUiSelectionValidateState.Input[0]>

export default function selectionExceptionalLabel(
  state: Contract.Input[0],
  options: Contract.Input[1]
): Contract.Output {
  if (state === "error") return "Menu Error"
  if (state === "undefined" || options === undefined) return "Menu Undefined"
  if (options.length === 0) return "No Items"
  return undefined
}

export type {Zavx0zImmersiveUiSelectionExceptionalLabel} from "./contract"
