/**
Высота видимых строк коллекции.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {CollectionVisibleRowsHeightInput} from "./contract/input"
import fieldMetric from "@ui-fields-metrics/field-metric"
import {normalizeVisibleRows} from "./src/helpers.ts"

export default function collectionVisibleRowsHeight(visibleRows: CollectionVisibleRowsHeightInput[0]): number {
  const normalizedRows = normalizeVisibleRows(visibleRows)
  return fieldMetric(`field-collection-rows-${normalizedRows}-height`)
}

export type {CollectionVisibleRowsHeightInput} from "./contract/input"
