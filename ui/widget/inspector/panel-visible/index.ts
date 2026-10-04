/**
Видимость панели инспектора при выборе категории и поиске.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {Zavx0zImmersiveUiWidgetInspectorPanelVisible as Contract} from "./contract"

export default function isInspectorPanelVisible(
  categories: Contract.Input[0],
  selectedCategoryId: Contract.Input[1],
  query: Contract.Input[2],
  panel: Contract.Input[3]
): Contract.Output {
  const selected = categories.find(category => category.id === selectedCategoryId)
  const allowed = selected?.panelIds === undefined ? null : new Set(selected.panelIds)
  const categoryVisible = selected !== undefined && (allowed === null || allowed.has(panel.id))
  const normalizedQuery = query.trim().toLocaleLowerCase()
  return categoryVisible && (normalizedQuery.length === 0 || panel.label.toLocaleLowerCase().includes(normalizedQuery))
}
export type {Zavx0zImmersiveUiWidgetInspectorPanelVisible} from "./contract"
