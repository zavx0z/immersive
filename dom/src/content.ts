import {DocumentFragment} from "./document-fragment.ts"
import {DOMGroup} from "./dom-group.ts"
import {Node} from "./node.ts"
import {domComponentConstructorBrand, type DOMComponentContent, type DOMConstruction, type DOMSlotContent} from "./dom-component.ts"
import type {Document} from "./document.ts"

/** Снимок одного назначения slot content; Nodes/Groups сохраняют identity, construction остаётся данными. */
export function retainDOMContent(document: Document, content: DOMComponentContent, allowedSlotNames?: readonly string[]): DOMComponentContent {
  const nodes = new Set<Node>()
  const ancestors = new Set<object>()
  const inspectNode = (node: Node): void => {
    if (node.ownerDocument !== document) throw new TypeError("DOM content must belong to the receiving Document")
    if (node.nodeType === Node.DOCUMENT_NODE) throw new TypeError("A Document cannot be child content")
    if (nodes.has(node)) throw new TypeError("DOM content cannot assign a Node more than once")
    nodes.add(node)
  }
  const enter = (value: object): void => {
    if (ancestors.has(value)) throw new TypeError("DOM content cannot contain itself")
    ancestors.add(value)
  }
  const retainMap = (map: DOMComponentContent, allowed?: readonly string[]): DOMComponentContent => {
    if (!isRecord(map)) throw new TypeError("DOM content must be a slot map")
    enter(map)
    try {
      const names = allowed === undefined ? undefined : new Set(allowed)
      return Object.freeze(Object.fromEntries(Object.entries(map).map(([name, value]) => {
        if (names && !names.has(name)) throw new TypeError(`Unknown DOM content slot ${JSON.stringify(name)}`)
        return [name, retain(value)]
      })))
    } finally { ancestors.delete(map) }
  }
  const retain = (value: DOMSlotContent): DOMSlotContent => {
    if (value == null || typeof value === "string" || typeof value === "number" || typeof value === "bigint" || typeof value === "boolean") return value
    if (value instanceof DocumentFragment) {
      if (value.ownerDocument !== document) throw new TypeError("DOM content must belong to the receiving Document")
      return Object.freeze(value.childNodes.map(node => { inspectNode(node); return node }))
    }
    if (value instanceof DOMGroup) {
      for (const node of value.insertionNodes) inspectNode(node)
      return value
    }
    if (value instanceof Node) { inspectNode(value); return value }
    if (Array.isArray(value)) {
      enter(value)
      try { return Object.freeze(value.map(retain)) } finally { ancestors.delete(value) }
    }
    const construction = value as DOMConstruction<any>
    if (isRecord(value) && typeof construction.type === "function" && construction.type[domComponentConstructorBrand] === true) {
      enter(construction)
      try {
        return Object.freeze(construction.content === undefined ? {...construction} : {
          ...construction, content: retainMap(construction.content, construction.type.slots),
        })
      } finally { ancestors.delete(construction) }
    }
    throw new TypeError("DOM content requires primitives, Nodes, DOMGroup or DOMConstruction")
  }
  return retainMap(content, allowedSlotNames)
}

function isRecord(value: unknown): value is Record<string, any> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}
