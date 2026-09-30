/**
Нормализация числа видимых строк коллекции.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {NormalizeCollectionVisibleRowsInput} from "./contract/input"
import COLLECTION_DEFAULT_VISIBLE_ROWS from "@ui-fields-collection-model/collection-default-visible-rows"
import COLLECTION_MAX_VISIBLE_ROWS from "@ui-fields-collection-model/collection-max-visible-rows"
import COLLECTION_MIN_VISIBLE_ROWS from "@ui-fields-collection-model/collection-min-visible-rows"

export default function normalizeCollectionVisibleRows(value: NormalizeCollectionVisibleRowsInput[0] = COLLECTION_DEFAULT_VISIBLE_ROWS): number {
  if (!Number.isFinite(value)) return COLLECTION_DEFAULT_VISIBLE_ROWS
  return Math.max(COLLECTION_MIN_VISIBLE_ROWS, Math.min(COLLECTION_MAX_VISIBLE_ROWS, Math.trunc(value)))
}

export type {NormalizeCollectionVisibleRowsInput} from "./contract/input"
