/** Частная причина отказа реализации до публикации числовой геометрии. */
export type ErrorCode = "DUPLICATE_NODE" | "UNKNOWN_PARENT" | "CYCLE_DETECTED" | "INVALID_GEOMETRY" | "INVALID_ID"

export class PrismTreeLayoutError extends Error {
  override readonly name = "PrismTreeLayoutError"

  constructor(
    readonly code: ErrorCode,
    readonly witness: Readonly<{nodeIds: readonly string[]; field?: string}>,
  ) {
    super(`PRISM_TREE_${code}: ${witness.nodeIds.join(", ")}${witness.field ? ` (${witness.field})` : ""}`)
  }
}

export function finite(value: number, field: string, nodeIds: readonly string[] = [], positive = false): number {
  if (!Number.isFinite(value) || (positive ? value <= 0 : value < 0)) throw new PrismTreeLayoutError("INVALID_GEOMETRY", {nodeIds, field})
  return value
}
