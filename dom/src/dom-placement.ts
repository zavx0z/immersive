import {Node} from "./node.ts"
import {DOMGroup} from "./dom-group.ts"
import {DocumentFragment} from "./document-fragment.ts"
import {HTMLElement} from "./html-element.ts"
import {domComponentConstructorBrand} from "./dom-component.ts"
import type {Document} from "./document.ts"
import type {DomOriginSnapshot} from "../contract/placement.ts"

export type {DomOriginSnapshot} from "../contract/placement.ts"

/** Проверяет только фактические nodes: без создания компонентов или исполнения bindings. */
export function validateDomNodes(document: Document, nodes: readonly Node[], receivingNode?: Node): void {
  const seen = new Set<Node>()
  for (const node of nodes) {
    if (node.ownerDocument !== document) throw new TypeError("DOM content must belong to the receiving Document")
    if (seen.has(node)) throw new TypeError("DOM content cannot repeat a Node")
    if (receivingNode && node.contains(receivingNode)) throw new TypeError("DOM content cannot contain its receiving range")
    seen.add(node)
  }
}

const emptyOrigins: DomOriginSnapshot = Object.freeze({nodes: Object.freeze([]), restore() {}, restoreFocus() {}})

/** Читает raw DOM inputs; construction records остаются данными, props/context не обходятся. */
export function captureDomOrigins(document: Document, values: unknown): DomOriginSnapshot {
  if (values === null || typeof values !== "object") return emptyOrigins
  const origins = new Map<Node, {parent: Node | null, before: Node | null}>()
  const seen = new Set<object>()
  const add = (node: Node): void => {
    if (!origins.has(node)) origins.set(node, {parent: node.parentNode, before: node.nextSibling})
  }
  const visit = (value: unknown): void => {
    if (value === null || typeof value !== "object" || seen.has(value)) return
    seen.add(value)
    if (value instanceof DOMGroup) for (const node of value.insertionNodes) add(node)
    else if (value instanceof DocumentFragment) for (const node of value.childNodes) add(node)
    else if (value instanceof Node) add(value)
    else if (Array.isArray(value)) for (const child of value) visit(child)
    else {
      const prototype = Object.getPrototypeOf(value)
      if (prototype !== Object.prototype && prototype !== null) return
      const record = value as Record<string, unknown>
      if (typeof record.type === "function" && (record.type as unknown as Record<symbol, unknown>)[domComponentConstructorBrand] === true) visit(record.content)
      else for (const child of Object.values(record)) visit(child)
    }
  }
  visit(values)
  if (!origins.size) return emptyOrigins
  const nodes = Object.freeze([...origins.keys()])
  const focus = document.activeElement
  const restoreFocus = (): void => {
    if (focus instanceof HTMLElement && focus.ownerDocument === document && focus.isConnected && nodes.some(node => node.contains(focus))) focus.focus()
  }
  return Object.freeze({nodes, restoreFocus, restore() {
    document.transaction(() => {
      const restored = new Set<Node>()
      const errors: unknown[] = []
      for (const first of nodes) {
        const stack: Array<{node: Node, apply: boolean}> = [{node: first, apply: false}]
        while (stack.length) {
          const {node, apply} = stack.pop()!
          const origin = origins.get(node)!
          if (!apply) {
            if (restored.has(node)) continue
            restored.add(node)
            stack.push({node, apply: true})
            if (origin.before && origins.has(origin.before)) stack.push({node: origin.before, apply: false})
            if (origin.parent && origins.has(origin.parent)) stack.push({node: origin.parent, apply: false})
            continue
          }
          try {
            if (origin.parent) {
              const before = origin.before?.parentNode === origin.parent ? origin.before : null
              if (node.parentNode !== origin.parent || node.nextSibling !== before) origin.parent.insertBefore(node, before)
            } else node.parentNode?.removeChild(node)
          } catch (error) { errors.push(error) }
        }
      }
      try { restoreFocus() } catch (error) { errors.push(error) }
      if (errors.length === 1) throw errors[0]
      if (errors.length > 1) throw new AggregateError(errors, "DOM origins restoration failed")
    })
  }})
}
