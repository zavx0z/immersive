/**
Выбирает базовую высоту коллекции по видимым строкам и колонке доступных действий.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {Zavx0zImmersiveUiFieldMetricCollectionHeight as Contract} from "./contract"
import collectionVisibleRowsHeight from "@zavx0z/immersive-ui-field-metric-collection-visible-rows-height"
import fieldMetric from "@zavx0z/immersive-ui-field-metric-read"

export default function collectionFieldHeight(visibleRows: Contract.Input[0], movable: Contract.Input[1]): Contract.Output {
  const visibleHeight = collectionVisibleRowsHeight(visibleRows)
  const actionCount = movable ? 4 : 2
  const actionsHeight = actionCount * fieldMetric("field-collection-action-height") +
    (actionCount - 1) * fieldMetric("field-collection-action-gap")
  return Math.max(visibleHeight, actionsHeight)
}

export type {Zavx0zImmersiveUiFieldMetricCollectionHeight} from "./contract"
