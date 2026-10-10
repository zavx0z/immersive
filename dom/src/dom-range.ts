import type {Node} from "./node.ts"
import type {DOMInsertion} from "./dom-group.ts"
import {domError} from "./internal/errors.ts"

export const replaceDOMRangeContent = Symbol("replaceDOMRangeContent")

/** Заменяет только Nodes между двумя границами после общего native preflight. */
export function replaceDomRangeContent(start: Node, end: Node, content: readonly DOMInsertion[]): void {
  const parent = start.parentNode
  if (!parent || end.parentNode !== parent) throw domError("InvalidStateError", "DOM range boundaries must share one parent")
  parent[replaceDOMRangeContent](start, end, content)
}
