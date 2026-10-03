/**
Поиск варианта выбора.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {UiSelectionFindSelectionOption as Contract} from "./contract"
import type {UiSelectionValidateSelectionOptions} from "@ui-selection/validate-selection-options"
type SelectionOptionShape = UiSelectionValidateSelectionOptions.Input[0][number]

export default function findSelectionOption<T extends SelectionOptionShape>(
  value: Contract.Input<T>[0],
  options: Contract.Input<T>[1]
): Contract.Output<T> {
  return options.find(option => option.value === value)
}

export type {UiSelectionFindSelectionOption} from "./contract"
