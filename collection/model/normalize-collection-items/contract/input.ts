import type {CollectionItemShape} from "./types"

/** Аргументы публичной операции normalizeCollectionItems; порядок сохраняет её форму вызова. */
export type NormalizeCollectionItemsInput<T extends CollectionItemShape> = readonly [
  items: readonly T[],
  selectedId: string | null
]
