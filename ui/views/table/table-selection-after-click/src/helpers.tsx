

/** Частная подготовка изменение выбора строк таблицы после пользовательского жеста. */
export function tableRangeKeys(rowKeys: readonly string[], from: string, to: string): string[] {
  const first = rowKeys.indexOf(from)
  const last = rowKeys.indexOf(to)
  if (first < 0 || last < 0) return [to]
  return rowKeys.slice(Math.min(first, last), Math.max(first, last) + 1)
}

/** Частная подготовка изменение выбора строк таблицы после пользовательского жеста. */
export function uniqueKeys(keys: readonly string[]): string[] {
  const next: string[] = []
  for (const key of keys) if (!next.includes(key)) next.push(key)
  return next
}
