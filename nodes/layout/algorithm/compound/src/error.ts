/** Причина отказа до публикации геометрии. */
export type CompoundLayoutErrorCode =
  | "DUPLICATE_NODE"
  | "UNKNOWN_PARENT"
  | "CYCLE_DETECTED"
  | "INVALID_GEOMETRY"

/** Структурированный отказ с ID нарушения и именем числового поля. */
export class CompoundLayoutError extends Error {
  override readonly name = "CompoundLayoutError"

  constructor(
    readonly code: CompoundLayoutErrorCode,
    readonly witness: Readonly<{nodeIds: readonly string[]; field?: string}>,
  ) {
    super(`COMPOUND_${code}: ${witness.nodeIds.join(", ")}${witness.field ? ` (${witness.field})` : ""}`)
  }
}
