/**
Обработка selection-exceptional-label.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {SelectionExceptionalLabelInput} from "./contract/input"
import type {SelectionOptionShape} from "@ui-selection/validate-selection-options"
import type {SelectionState} from "@ui-selection/validate-selection-options"

export default function selectionExceptionalLabel(
  state: SelectionExceptionalLabelInput[0],
  options: SelectionExceptionalLabelInput[1]
): string | undefined {
  if (state === "error") return "Menu Error"
  if (state === "undefined" || options === undefined) return "Menu Undefined"
  if (options.length === 0) return "No Items"
  return undefined
}

export type {SelectionExceptionalLabelInput} from "./contract/input"
