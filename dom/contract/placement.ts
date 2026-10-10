import type {Node} from "../src/node.ts"

/** Снимок фактических DOM origins одной подготовленной операции. */
export interface DomOriginSnapshot {
  readonly nodes: readonly Node[]
  restore(): void
  restoreFocus(): void
}
