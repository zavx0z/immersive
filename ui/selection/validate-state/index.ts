/**
Проверка состояния выбора.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiSelectionValidateState as Contract} from "./contract"

export default function validateSelectionState(state: Contract.Input[0]): Contract.Output {
  if (state !== undefined && state !== "ready" && state !== "undefined" && state !== "error") {
    throw new Error(`Unknown selection state: ${state}`)
  }
}

export type {ImmersiveUiSelectionValidateState} from "./contract"
