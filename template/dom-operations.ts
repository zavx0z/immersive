/**
Операции над существующим DOM для HTML-шаблонов и готовых привязок.
Состояние компонентов, hooks, сопоставление ключей и планировщик сюда не входят.
*/
import {Comment, DocumentFragment, Element, HTMLElement, HTMLInputElement, HTMLOptionElement,
  HTMLSelectElement, HTMLTextAreaElement, Node, Text, type Document, type EventListener} from "@zavx0z/immersive-dom"

export type PropertyOperation = {current(): unknown, next: unknown, write(value: unknown): void}
export type DomPatch = {apply(): void, rollback(): void}
const domAnchors = new WeakSet<Node>()
export function markDomAnchor(node: Node): void { domAnchors.add(node) }
export function isDomAnchor(node: Node): boolean { return domAnchors.has(node) }
export function createDomAnchor(document: Document, data: string): Comment {
  const anchor = document.createComment(data)
  markDomAnchor(anchor)
  return anchor
}

/** Один prepare/apply/rollback путь изменения существующего DOM-значения. */
export function prepareDomOperation(operation: PropertyOperation): DomPatch | null {
  const previous = operation.current()
  if (Object.is(previous, operation.next)) return null
  return {apply: () => operation.write(operation.next), rollback: () => operation.write(previous)}
}
export function applyDomOperation(operation: PropertyOperation): void { prepareDomOperation(operation)?.apply() }
export function prepareTextOperation(target: Text, next: string): DomPatch | null {
  const previous = target.data
  if (previous === next) return null
  return {apply: () => { target.data = next }, rollback: () => { target.data = previous }}
}

/** Существующий DOM либо фиксированная группа существующих узлов. Fragment раскрывается один раз. */
export type DomNodes = Node | readonly Node[]
/** Читает текущие узлы Fragment; retention принадлежит конкретному получателю. */
export function snapshotDomNodes(value: DomNodes): readonly Node[] {
  if (Array.isArray(value)) return Object.freeze(value.flatMap(node => [...snapshotDomNodes(node)]))
  if (!(value instanceof Node)) throw new TypeError("DOM content requires real Nodes")
  if (value instanceof DocumentFragment) {
    return Object.freeze([...value.childNodes])
  }
  if (value.nodeType === Node.DOCUMENT_NODE) throw new TypeError("A Document cannot be child content")
  return [value]
}

export function attributeOperation(target: Element, name: string, value: unknown): PropertyOperation {
  return {current: () => target.getAttribute(name), next: attributeValue(value, name),
    write(next) {
      if (next === null) target.removeAttribute(name)
      else target.setAttribute(name, next as string)
    },
  }
}

/** Один стабильный listener; замена значения не перевешивает DOM-подписку. */
export class DomEventBinding {
  private handler: EventListener | null = null
  private readonly listener: EventListener
  constructor(
    private readonly target: Element,
    private readonly type: string,
    private readonly capture = false,
    dispatch: (invoke: () => void) => void = invoke => invoke(),
  ) {
    this.listener = event => {
      const handler = this.handler
      if (!handler) return
      dispatch(() => {
        if (typeof handler === "function") handler.call(this.target, event)
        else handler.handleEvent(event)
      })
    }
    target.addEventListener(type, this.listener, {capture})
  }
  prepare(value: unknown, allowObject = true): DomPatch | null {
    const next = value == null || (allowObject && value === false) ? null : value
    if (next !== null && typeof next !== "function" && !(allowObject && typeof next === "object" &&
      "handleEvent" in next && typeof next.handleEvent === "function")) {
      throw new TypeError("An event binding requires a listener or null")
    }
    if (next === this.handler) return null
    const previous = this.handler
    return {apply: () => { this.handler = next as EventListener | null }, rollback: () => { this.handler = previous }}
  }
  dispose(): void {
    this.target.removeEventListener(this.type, this.listener, {capture: this.capture})
    this.handler = null
  }
}

/** Lifecycle подготовленного содержимого; реализация может принадлежать верхнему владельцу. */
export const domContent = Symbol.for("@zavx0z/immersive-template/dom-content")
export interface DomContentInstance {
  update(value: unknown): boolean
  commit?(): void
  dispose(): void
}
export interface DomContent {
  [domContent]?(parent: Element | DocumentFragment, before: Node): DomContentInstance
}
export interface DomContentAdapter {
  accepts(value: unknown): boolean
  mount(parent: Element | DocumentFragment, before: Node, value: unknown): DomContentInstance
}
export function isDomContent(value: unknown): value is DomContent {
  return typeof value === "object" && value !== null && typeof (value as Partial<DomContent>)[domContent] === "function"
}
const contentAdapter: DomContentAdapter = {
  accepts: isDomContent,
  mount: (parent, before, value) => (value as Required<DomContent>)[domContent](parent, before),
}
const contentAdapters = new Set<DomContentAdapter>([contentAdapter])
/** Верхний владелец предоставляет lifecycle своего значения; Template сохраняет независимость. */
export function registerDomContentAdapter(adapter: DomContentAdapter): () => void {
  contentAdapters.add(adapter)
  return () => { contentAdapters.delete(adapter) }
}
type RegionValue =
  | {type: "empty"}
  | {type: "text", node: Text}
  | {type: "nodes", nodes: readonly Node[], source?: DomNodes | null | undefined}
  | {type: "content", adapter: DomContentAdapter, instance: DomContentInstance}
  | {type: "array", items: DomContentRange[]}

/** Один исполнитель дочерней DOM-области; он не создаёт Document или scheduler. */
export class DomContentRange {
  private current: RegionValue = {type: "empty"}
  private readonly start: Comment
  constructor(
    private readonly anchor: Comment,
    private readonly adapters: readonly DomContentAdapter[] = [],
    private readonly createAnchor: (document: Document) => Comment = document => createDomAnchor(document, "content:item"),
    start?: Comment,
  ) {
    this.start = start ?? createAnchor(anchor.ownerDocument!)
    if (!start) anchor.parentNode!.insertBefore(this.start, anchor)
  }

  prepareNodes(value: DomNodes | null | undefined): DomPatch {
    const nodes = value == null ? [] : this.retainedNodes(value)
    this.validateNodes(nodes)
    const previous = this.current.type === "nodes" ? this.current.nodes.filter(node => this.owns(node)) : []
    const focus = this.anchor.ownerDocument?.activeElement
    const restoreFocus = focus instanceof HTMLElement && previous.some(node => node.contains(focus))
    const origins = nodes.map(node => ({node, parent: node.parentNode, before: node.nextSibling}))
    return {apply: () => this.commitNodes(nodes, value), rollback: () => {
      for (const {node, parent, before} of origins.reverse()) {
        if (parent && !previous.includes(node)) parent.insertBefore(node, before?.parentNode === parent ? before : null)
        else if (!parent && this.owns(node)) node.parentNode!.removeChild(node)
      }
      this.commitNodes(previous)
      if (restoreFocus) focus.focus()
    }}
  }

  commit(value: unknown, ancestors?: ReadonlySet<readonly unknown[]>): void {
    if (value == null || typeof value === "boolean") {
      this.clear()
      return
    }
    const adapter = [...contentAdapters, ...this.adapters].find(candidate => candidate.accepts(value))
    if (adapter) {
      if (this.current.type === "content" && this.current.adapter === adapter && this.current.instance.update(value)) return
      this.clear()
      const {parent} = this.context()
      this.current = {type: "content", adapter, instance: adapter.mount(parent, this.anchor, value)}
      return
    }
    if (value instanceof Node) {
      this.commitNodes(this.retainedNodes(value), value)
      return
    }
    if (Array.isArray(value)) {
      if (ancestors?.has(value)) throw new TypeError("DOM child arrays cannot contain themselves")
      const nextAncestors = new Set(ancestors ?? [])
      nextAncestors.add(value)
      if (this.current.type !== "array") {
        this.clear()
        this.current = {type: "array", items: []}
      }
      const {document, parent} = this.context()
      const items = this.current.items
      for (let index = 0; index < value.length; index++) {
        let item = items[index]
        if (!item) {
          const anchor = this.createAnchor(document)
          parent.insertBefore(anchor, this.anchor)
          item = new DomContentRange(anchor, this.adapters, this.createAnchor)
          items.push(item)
        }
        item.commit(value[index], nextAncestors)
      }
      while (items.length > value.length) items.pop()!.dispose()
      return
    }
    const next = textValue(value)
    if (this.current.type === "text") {
      prepareTextOperation(this.current.node, next)?.apply()
      return
    }
    this.clear()
    const {document, parent} = this.context()
    const node = document.createTextNode(next)
    parent.insertBefore(node, this.anchor)
    this.current = {type: "text", node}
  }

  dispose(removeAnchor = true): void {
    try { this.clear() } finally {
      if (removeAnchor) {
        this.start.parentNode?.removeChild(this.start)
        this.anchor.parentNode?.removeChild(this.anchor)
      }
    }
  }

  commitMounted(): void {
    if (this.current.type === "content") this.current.instance.commit?.()
    else if (this.current.type === "array") for (const item of this.current.items) item.commitMounted()
  }

  private validateNodes(nodes: readonly Node[]): void {
    const document = this.anchor.ownerDocument
    const seen = new Set<Node>()
    for (const node of nodes) {
      if (node.ownerDocument !== document) throw new TypeError("DOM content must belong to the receiving Document")
      if (seen.has(node)) throw new TypeError("DOM content cannot repeat a Node")
      if (node.contains(this.anchor)) throw new TypeError("DOM content cannot contain its receiving range")
      seen.add(node)
    }
  }

  private retainedNodes(value: DomNodes): readonly Node[] {
    if (value instanceof DocumentFragment && value.childNodes.length === 0 &&
      this.current.type === "nodes" && this.current.source === value) return this.current.nodes
    return snapshotDomNodes(value)
  }

  private owns(node: Node): boolean {
    if (node.parentNode !== this.anchor.parentNode) return false
    for (let cursor = this.start.nextSibling; cursor && cursor !== this.anchor; cursor = cursor.nextSibling) if (cursor === node) return true
    return false
  }

  private commitNodes(nodes: readonly Node[], source?: DomNodes | null): void {
    this.validateNodes(nodes)
    const {parent} = this.context()
    if (this.current.type === "nodes") {
      const next = new Set(nodes)
      for (const previous of this.current.nodes) {
        if (!next.has(previous) && this.owns(previous)) parent.removeChild(previous)
      }
    } else this.clear()
    for (let index = nodes.length - 1; index >= 0; index--) {
      const node = nodes[index]!
      const before = nodes[index + 1] ?? this.anchor
      if (node.parentNode !== parent || node.nextSibling !== before) parent.insertBefore(node, before)
    }
    this.current = {type: "nodes", nodes, source}
  }

  private clear(): void {
    const current = this.current
    this.current = {type: "empty"}
    if (current.type === "content") current.instance.dispose()
    else if (current.type === "array") {
      let firstError: unknown = null
      for (const item of current.items) {
        try { item.dispose() } catch (error) { firstError ??= error }
      }
      if (firstError) throw firstError
    }
    else {
      const nodes = current.type === "nodes" ? current.nodes : current.type === "text" ? [current.node] : []
      for (const node of nodes) if (this.owns(node)) node.parentNode?.removeChild(node)
    }
  }

  private context(): {document: Document, parent: Element | DocumentFragment} {
    const parent = this.anchor.parentNode
    const document = this.anchor.ownerDocument
    if (!(parent instanceof Element || parent instanceof DocumentFragment) || !document) throw new Error("DOM content range is detached")
    return {document, parent}
  }
}

/** Переносит либо удаляет тот же включительный диапазон, не копируя его узлы. */
export function moveDomRange(start: Node, end: Node, parent: Node, before: Node | null): void {
  let current: Node | null = start
  while (current) {
    const next: Node | null = current.nextSibling
    parent.insertBefore(current, before)
    if (current === end) return
    current = next
  }
}
export function removeDomRange(start: Node, end: Node): void {
  const parent = start.parentNode
  if (!parent || end.parentNode !== parent) return
  let current: Node | null = start
  while (current) {
    const next: Node | null = current.nextSibling
    parent.removeChild(current)
    if (current === end) return
    current = next
  }
}

export function propertyOperation(target: Element, name: string, value: unknown, explicit = false): PropertyOperation {
  if (explicit) return {current: () => Reflect.get(target, name), next: value, write: next => { Reflect.set(target, name, next) }}
  if (name === "style") {
    throw new TypeError("Style values require a bindStyle binding")
  }
  if (name === "value" && (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLOptionElement
  )) {
    const next = value === null || value === undefined ? "" : String(value)
    return {current: () => target.value, next, write: source => { target.value = source as string }}
  }
  if (name === "checked" && target instanceof HTMLInputElement) {
    const next = Boolean(value)
    return {current: () => target.checked, next, write: source => { target.checked = source as boolean }}
  }
  if (name === "indeterminate" && target instanceof HTMLInputElement) {
    const next = Boolean(value)
    return {
      current: () => target.indeterminate,
      next,
      write: source => { target.indeterminate = source as boolean }
    }
  }
  if (name === "selected" && target instanceof HTMLOptionElement) {
    const next = Boolean(value)
    return {current: () => target.selected, next, write: source => { target.selected = source as boolean }}
  }
  if (name === "selectedIndex" && target instanceof HTMLSelectElement) {
    const next = Number(value)
    if (!Number.isFinite(next)) throw new TypeError("selectedIndex must be a finite number")
    return {
      current: () => target.selectedIndex,
      next,
      write: source => { target.selectedIndex = source as number }
    }
  }
  if (name === "tabIndex" && target instanceof HTMLElement) {
    const next = Number(value)
    if (!Number.isFinite(next)) throw new TypeError("tabIndex must be a finite number")
    return {current: () => target.tabIndex, next, write: source => { target.tabIndex = source as number }}
  }
  const attributeName = name === "className" ? "class" : name
  return attributeOperation(target, attributeName, value)
}

export function attributeValue(value: unknown, name: string): string | null {
  if (value === null || value === undefined || value === false) return null
  if (value === true) return ""
  if (
    typeof value === "string" || typeof value === "number" || typeof value === "bigint"
  ) return String(value)
  throw new TypeError(`Host property ${name} requires a primitive value`)
}

export function hasPropertySetter(target: Element, name: string): boolean {
  for (let prototype: object | null = target; prototype !== null; prototype = Object.getPrototypeOf(prototype)) {
    const descriptor = Object.getOwnPropertyDescriptor(prototype, name)
    if (descriptor !== undefined) return typeof descriptor.set === "function"
  }
  return false
}

export function textValue(value: unknown): string {
  if (value === null || value === undefined || typeof value === "boolean") return ""
  if (typeof value === "string" || typeof value === "number" || typeof value === "bigint") {
    return String(value)
  }
  throw new TypeError("A compiled text binding requires a primitive value")
}
