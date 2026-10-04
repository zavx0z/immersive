/**
Высота видимых строк коллекции.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {Zavx0zImmersiveUiFieldCollectionModelVisibleRowsHeight as Contract} from "./contract"
import resolveCollectionVisibleRowsHeight from "@zavx0z/immersive-ui-field-metric-collection-visible-rows-height"

export default function collectionVisibleRowsHeight(rows: Contract.Input[0]): Contract.Output {
  return resolveCollectionVisibleRowsHeight(rows)
}

export type {Zavx0zImmersiveUiFieldCollectionModelVisibleRowsHeight} from "./contract"
