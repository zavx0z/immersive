/**
Высота коллекции с учётом доступных действий.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {CollectionFieldHeightInput} from "./contract/input"
import collectionVisibleRowsHeight from "@ui-fields-metrics/collection-visible-rows-height"
import fieldMetric from "@ui-fields-metrics/field-metric"

export default function collectionFieldHeight(visibleRows: CollectionFieldHeightInput[0], movable: CollectionFieldHeightInput[1]): number {
  const visibleHeight = collectionVisibleRowsHeight(visibleRows)
  const actionCount = movable ? 4 : 2
  const actionsHeight = actionCount * fieldMetric("field-collection-action-height") +
    (actionCount - 1) * fieldMetric("field-collection-action-gap")
  return Math.max(visibleHeight, actionsHeight)
}

export type {CollectionFieldHeightInput} from "./contract/input"
