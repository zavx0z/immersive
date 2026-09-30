/**
Изменение выбора строк таблицы после пользовательского жеста.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {TableSelectionGesture} from "@ui-views/table"
import type {TableSelectionUpdate} from "@ui-views/table"
import normalizeTableSelection from "@ui-views-table/normalize-table-selection"
import {tableRangeKeys} from "./src/helpers.tsx"
import {uniqueKeys} from "./src/helpers.tsx"

export default function tableSelectionAfterClick(
  rowKeys: readonly string[],
  currentSelectedKeys: readonly string[],
  clickedKey: string,
  anchorKey: string | null,
  gesture: TableSelectionGesture = {}
): TableSelectionUpdate {
  const selected = normalizeTableSelection(rowKeys, currentSelectedKeys)
  const additive = gesture.metaKey === true || gesture.ctrlKey === true
  if (gesture.shiftKey === true) {
    const range = tableRangeKeys(rowKeys, anchorKey ?? selected.at(-1) ?? clickedKey, clickedKey)
    return Object.freeze({
      selectedKeys: Object.freeze(additive ? uniqueKeys([...selected, ...range]) : range),
      anchorKey: anchorKey ?? clickedKey
    })
  }
  if (additive) {
    const next = selected.includes(clickedKey)
      ? selected.filter(key => key !== clickedKey)
      : [...selected, clickedKey]
    return Object.freeze({selectedKeys: Object.freeze(next), anchorKey: clickedKey})
  }
  return Object.freeze({selectedKeys: Object.freeze([clickedKey]), anchorKey: clickedKey})
}
