/**
Высота видимых строк коллекции.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {CollectionVisibleRowsHeightInput} from "./contract/input"
import resolveCollectionVisibleRowsHeight from "@ui-fields-metrics/collection-visible-rows-height"

export default function collectionVisibleRowsHeight(rows: CollectionVisibleRowsHeightInput[0]): number {
  return resolveCollectionVisibleRowsHeight(rows)
}

export type {CollectionVisibleRowsHeightInput} from "./contract/input"
