import type {Document} from "../src/document.ts"
import type {Node} from "../src/node.ts"
import type {DOMGroup} from "../src/dom-group.ts"

export type ConnectionTarget = Node | DOMGroup
/** Точные native изменения Node доставляются один раз после общей transaction. */
export type ConnectionCallbacks = Readonly<{
  connected?(): void
  disconnected?(): void
  adopted?(previous: Document, next: Document): void
  readonly attributes?: readonly string[]
  readonly properties?: readonly string[]
  changed?(): void
}>
export interface ConnectionScope {
  /** Подавляет новые уведомления только этого scope во время собственных записей. */
  suppressChanges<Result>(callback: () => Result): Result
  dispose(): void
}
