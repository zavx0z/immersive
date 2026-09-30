/**
Поиск варианта выбора.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {FindSelectionOptionInput} from "./contract/input"
import type {SelectionOptionShape} from "@ui-selection/validate-selection-options"

export default function findSelectionOption<T extends SelectionOptionShape>(
  value: FindSelectionOptionInput<T>[0],
  options: FindSelectionOptionInput<T>[1]
): T | undefined {
  return options.find(option => option.value === value)
}

export type {FindSelectionOptionInput} from "./contract/input"
