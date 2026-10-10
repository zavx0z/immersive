import {markDomAnchor} from "./internal/dom-anchor.ts"
import type {Document} from "./document.ts"
import type {Node} from "./node.ts"
import type {Comment} from "./comment.ts"
import type {DocumentFragment} from "./document-fragment.ts"
import {domError} from "./internal/errors.ts"

import type {DOMInsertion} from "../contract/dom-group.ts"
export type {DOMInsertion} from "../contract/dom-group.ts"
export const groupRange = Symbol("groupRange")
export const groupConnectionNodes = Symbol("groupConnectionNodes")
export const groupParking = Symbol("groupParking")
export const insertGroupContent = Symbol("insertGroupContent")
export const replaceGroupContent = Symbol("replaceGroupContent")
const groupsByStart = new WeakMap<Node, DOMGroup>()
export const groupStartingAt = (node: Node): DOMGroup | undefined => groupsByStart.get(node)

/** Диапазон реальных Nodes без wrapper Element и без собственного semantic tree. */
export class DOMGroup {
  private readonly start: Comment
  private readonly end: Comment
  private parking: DocumentFragment

  constructor(document: Document, ...content: DOMInsertion[]) {
    this.start = document.createComment("group:start")
    this.end = document.createComment("group:end")
    markDomAnchor(this.start)
    markDomAnchor(this.end)
    this.parking = document.createDocumentFragment()
    this.parking.append(this.start, this.end)
    groupsByStart.set(this.start, this)
    if (content.length) this.append(...content)
  }

  get ownerDocument(): Document { return this.start.ownerDocument! }
  get parentNode(): Node | null {
    const parent = this.start.parentNode
    return parent === this.parking || parent !== this.end.parentNode ? null : parent
  }
  get isConnected(): boolean {
    if (!this.start.isConnected || this.start.parentNode !== this.end.parentNode) return false
    for (let node: Node | null = this.start; node; node = node.nextSibling) if (node === this.end) return true
    return false
  }
  get nextSibling(): Node | null { return this.parentNode ? this.end.nextSibling : null }
  get previousSibling(): Node | null { return this.parentNode ? this.start.previousSibling : null }
  get insertionNodes(): readonly Node[] { return Object.freeze([...this[groupRange]()]) }
  get nodes(): readonly Node[] { return Object.freeze(this[groupRange]().slice(1, -1)) }

  append(...content: DOMInsertion[]): void { this.insert(content, this.end) }
  prepend(...content: DOMInsertion[]): void { this.insert(content, this.start.nextSibling!) }
  replaceChildren(...content: DOMInsertion[]): void {
    const parent = this.start.parentNode
    if (!parent) throw domError("InvalidStateError", "DOMGroup boundaries are detached")
    parent[replaceGroupContent](this, content)
  }
  moveTo(parent: Node, before: Node | null = null): void {
    this[groupRange]()
    if (this.parentNode === parent && this.end.nextSibling === before) return
    parent.insertBefore(this, before)
  }
  remove(): void {
    this[groupRange]()
    if (this.start.parentNode === this.parking) return
    const parking = this[groupParking]()
    parking.append(this)
  }

  [groupParking](): DocumentFragment {
    if (this.parking.ownerDocument !== this.ownerDocument) this.parking = this.ownerDocument.createDocumentFragment()
    return this.parking
  }
  [groupRange](): readonly Node[] {
    const parent = this.start.parentNode
    if (!parent || this.end.parentNode !== parent) throw domError("InvalidStateError", "DOMGroup boundaries must share one parent")
    const result: Node[] = []
    for (let node: Node | null = this.start; node; node = node.nextSibling) {
      result.push(node)
      if (node === this.end) return result
    }
    throw domError("InvalidStateError", "DOMGroup boundaries must preserve their order")
  }
  /** Внутренние границы нужны connection scope; authored nodes остаются обычными Nodes. */
  [groupConnectionNodes](): readonly Node[] { return [this.start, this.end] }

  private insert(content: DOMInsertion[], before: Node): void {
    const parent = this.start.parentNode
    if (!parent) throw domError("InvalidStateError", "DOMGroup boundaries are detached")
    this[groupRange]()
    if (content.some(value => value === this)) throw domError("HierarchyRequestError", "DOMGroup cannot contain itself")
    parent[insertGroupContent](this, content, before)
  }
}
