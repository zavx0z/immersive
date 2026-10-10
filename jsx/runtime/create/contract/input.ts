/** Позиционные аргументы automatic JSX; вызов устраняется компилятором. */
export type RuntimeInput = readonly [
  type: unknown,
  props: Record<string, unknown> | null,
  key?: string | number | null,
]
