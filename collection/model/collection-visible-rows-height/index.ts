/**
Высота видимых строк коллекции.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {UiFieldsCollectionModelCollectionVisibleRowsHeight as Contract} from "./contract"
import resolveCollectionVisibleRowsHeight from "@ui-fields-metrics/collection-visible-rows-height"

export default function collectionVisibleRowsHeight(rows: Contract.Input[0]): Contract.Output {
  return resolveCollectionVisibleRowsHeight(rows)
}

export type {UiFieldsCollectionModelCollectionVisibleRowsHeight} from "./contract"
