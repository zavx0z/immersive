/**
Нормализация элементов коллекции.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {UiFieldsCollectionModelNormalizeCollectionItems as Contract} from "./contract"
import type {CollectionItemShape} from "./contract/types"

export default function normalizeCollectionItems<T extends CollectionItemShape>(
  items: Contract.Input<T>[0],
  selectedId: Contract.Input<T>[1]
): Contract.Output<T> {
  if (!Array.isArray(items)) throw new TypeError("CollectionField items must be an array")
  const ids = new Set<string>()
  const normalized = items.map(item => {
    if (typeof item.id !== "string" || item.id.length === 0) throw new TypeError("CollectionField item id must not be empty")
    if (ids.has(item.id)) throw new Error(`CollectionField item id must be unique: ${item.id}`)
    ids.add(item.id)
    if (typeof item.label !== "string") throw new TypeError("CollectionField item label must be a string")
    return Object.freeze({...item}) as T
  })
  if (selectedId !== null && !ids.has(selectedId)) {
    throw new Error(`CollectionField selected id does not exist: ${selectedId}`)
  }
  return Object.freeze(normalized)
}

export type {UiFieldsCollectionModelNormalizeCollectionItems} from "./contract"
