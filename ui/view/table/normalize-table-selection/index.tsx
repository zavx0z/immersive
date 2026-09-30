/**
Нормализация выбранных строк по составу таблицы.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/

export default function normalizeTableSelection(
  rowKeys: readonly string[],
  selectedKeys: readonly string[]
): string[] {
  const known = new Set(rowKeys)
  const next: string[] = []
  for (const key of selectedKeys) {
    if (!known.has(key) || next.includes(key)) continue
    next.push(key)
  }
  return next
}
