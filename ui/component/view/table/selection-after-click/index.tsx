/**
Изменение выбора строк таблицы после пользовательского жеста.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiComponentViewTableSelectionAfterClick as Contract} from "./contract"
export type {ImmersiveUiComponentViewTableSelectionAfterClick} from "./contract"
import normalizeTableSelection from "@immersive-ui-view-table/normalize-table-selection"
import {tableRangeKeys} from "./src/helpers.tsx"
import {uniqueKeys} from "./src/helpers.tsx"

export default function tableSelectionAfterClick(
  rowKeys: Contract.Input[0],
  currentSelectedKeys: Contract.Input[1],
  clickedKey: Contract.Input[2],
  anchorKey: Contract.Input[3],
  gesture: Contract.Input[4] = {}
): Contract.Output {
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
