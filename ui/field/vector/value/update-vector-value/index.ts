/**
Изменение вектора.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {UpdateVectorValueInput} from "./contract/input"

export default function updateVectorValue(
  value: UpdateVectorValueInput[0],
  index: UpdateVectorValueInput[1],
  next: UpdateVectorValueInput[2]
): readonly number[] {
  return Object.freeze(value.map((entry, entryIndex) => entryIndex === index ? next : entry))
}

export type {UpdateVectorValueInput} from "./contract/input"
