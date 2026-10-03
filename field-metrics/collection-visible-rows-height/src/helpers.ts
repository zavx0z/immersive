

/** Частная подготовка высота видимых строк коллекции. */
export function normalizeVisibleRows(value: number): 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 {
  if (!Number.isFinite(value)) return 3
  return Math.max(1, Math.min(8, Math.trunc(value))) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
}
