/** Наблюдение кеша и TypeScript snapshots одной сессии. */
export type JsxCompilerStats = Readonly<{
  cacheHits: number
  cacheMisses: number
  snapshots: number
}>
