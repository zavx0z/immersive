/**
Высота видимых строк коллекции.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {UiFieldsMetricsCollectionVisibleRowsHeight as Contract} from "./contract"
import fieldMetric from "@ui-fields-metrics/field-metric"
import {normalizeVisibleRows} from "./src/helpers.ts"

export default function collectionVisibleRowsHeight(visibleRows: Contract.Input[0]): Contract.Output {
  const normalizedRows = normalizeVisibleRows(visibleRows)
  return fieldMetric(`field-collection-rows-${normalizedRows}-height`)
}

export type {UiFieldsMetricsCollectionVisibleRowsHeight} from "./contract"
