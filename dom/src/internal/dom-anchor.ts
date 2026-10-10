import type {Node} from "../node.ts"
import type {Document} from "../document.ts"
import type {Comment} from "../comment.ts"

const anchors = new WeakSet<Node>()
export function markDomAnchor(node: Node): void { anchors.add(node) }
export function isDomAnchor(node: Node): boolean { return anchors.has(node) }
export function createDomAnchor(document: Document, data: string): Comment {
  const anchor = document.createComment(data)
  markDomAnchor(anchor)
  return anchor
}
