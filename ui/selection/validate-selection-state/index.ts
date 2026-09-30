/**
Проверка состояния выбора.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ValidateSelectionStateInput} from "./contract/input"
import type {SelectionState} from "@ui-selection/validate-selection-options"

export default function validateSelectionState(state: ValidateSelectionStateInput[0]): void {
  if (state !== undefined && state !== "ready" && state !== "undefined" && state !== "error") {
    throw new Error(`Unknown selection state: ${state}`)
  }
}

export type {ValidateSelectionStateInput} from "./contract/input"
