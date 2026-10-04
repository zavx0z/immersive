/**
Выбирает целое число видимых строк в пределах коллекции и применяет значение по умолчанию для неконечных чисел.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiFieldCollectionModelNormalizeVisibleRows as Contract} from "./contract"
import COLLECTION_DEFAULT_VISIBLE_ROWS from "@immersive-ui-field-collection-model/default-visible-rows"
import COLLECTION_MAX_VISIBLE_ROWS from "@immersive-ui-field-collection-model/max-visible-rows"
import COLLECTION_MIN_VISIBLE_ROWS from "@immersive-ui-field-collection-model/min-visible-rows"

export default function normalizeCollectionVisibleRows(value: Contract.Input[0] = COLLECTION_DEFAULT_VISIBLE_ROWS): Contract.Output {
  if (!Number.isFinite(value)) return COLLECTION_DEFAULT_VISIBLE_ROWS
  return Math.max(COLLECTION_MIN_VISIBLE_ROWS, Math.min(COLLECTION_MAX_VISIBLE_ROWS, Math.trunc(value)))
}

export type {ImmersiveUiFieldCollectionModelNormalizeVisibleRows} from "./contract"
