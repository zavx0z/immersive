/** Причина отказа до выдачи геометрии леса. */
export type HierarchyLayoutErrorCode =
  | "DUPLICATE_NODE"
  | "UNKNOWN_PARENT"
  | "CYCLE_DETECTED"
  | "INVALID_GEOMETRY"

/** Узлы, участвующие в отказе. Для цикла последний id повторяет первый. */
export interface HierarchyLayoutWitness {
  readonly nodeIds: readonly string[]
  readonly field?: string
}

/** Структурированный отказ раскладки с точным свидетелем нарушения. */
export class HierarchyLayoutError extends Error {
  override readonly name = "HierarchyLayoutError"

  constructor(
    readonly code: HierarchyLayoutErrorCode,
    readonly witness: HierarchyLayoutWitness,
  ) {
    super(`HIERARCHY_${code}: ${witness.nodeIds.join(", ")}${witness.field ? ` (${witness.field})` : ""}`)
  }
}
