/**
Видимость панели инспектора при выборе категории и поиске.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {InspectorCategory} from "@ui-widgets/inspector"

export default function isInspectorPanelVisible(
  categories: readonly InspectorCategory[],
  selectedCategoryId: string,
  query: string,
  panel: Readonly<{id: string; label: string}>
): boolean {
  const selected = categories.find(category => category.id === selectedCategoryId)
  const allowed = selected?.panelIds === undefined ? null : new Set(selected.panelIds)
  const categoryVisible = selected !== undefined && (allowed === null || allowed.has(panel.id))
  const normalizedQuery = query.trim().toLocaleLowerCase()
  return categoryVisible && (normalizedQuery.length === 0 || panel.label.toLocaleLowerCase().includes(normalizedQuery))
}
