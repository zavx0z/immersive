/**
Заменяет совпавшую по индексу координату в неизменяемой копии вектора.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {Zavx0zImmersiveUiFieldVectorValueUpdate as Contract} from "./contract"
export type {Zavx0zImmersiveUiFieldVectorValueUpdate} from "./contract"


export default function updateVectorValue(
  value: Contract.Input[0],
  index: Contract.Input[1],
  next: Contract.Input[2]
): Contract.Output {
  return Object.freeze(value.map((entry, entryIndex) => entryIndex === index ? next : entry))
}
