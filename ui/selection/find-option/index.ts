/**
Поиск варианта выбора.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {Zavx0zImmersiveUiSelectionFindOption as Contract} from "./contract"
import type {Zavx0zImmersiveUiSelectionValidateOptions} from "@zavx0z/immersive-ui-selection-validate-options"
type SelectionOptionShape = Zavx0zImmersiveUiSelectionValidateOptions.Input[0][number]

export default function findSelectionOption<T extends SelectionOptionShape>(
  value: Contract.Input<T>[0],
  options: Contract.Input<T>[1]
): Contract.Output<T> {
  return options.find(option => option.value === value)
}

export type {Zavx0zImmersiveUiSelectionFindOption} from "./contract"
