/** Исполнение дочерних HTML-значений; простые операции принадлежат DOM. */
import {Comment, DocumentFragment, DOMGroup, Element, HTMLElement, Node, Text, isDOMComponentConstructor, replaceDomRangeContent, captureDomOrigins, validateDomNodes, type DOMComponent, type DOMConstruction, type Document} from "@zavx0z/immersive-dom"
import {createDomAnchor, snapshotDomNodes, textValue, prepareTextOperation,
  type DomNodes, type DomPatch} from "@zavx0z/immersive-dom/bindings"
export * from "@zavx0z/immersive-dom/bindings"

/** Lifecycle подготовленного содержимого; реализация может принадлежать верхнему владельцу. */
export const domContent = Symbol.for("@zavx0z/immersive-template/dom-content")
export interface DomContentInstance {
  update(value: unknown): boolean
  commit?(): void
  prepareDispose?(): () => void
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
type NativeContent = DomNodes | DOMGroup
type RegionValue =
  | {type: "empty"}
  | {type: "text", node: Text}
  | {type: "nodes", nodes: readonly Node[], source?: NativeContent | null | undefined}
  | {type: "construction", instance: DOMComponent<unknown>, constructor: DOMConstruction["type"], key: string | number | null}
  | {type: "content", adapter: DomContentAdapter, instance: DomContentInstance}
  | {type: "array", items: DomContentRange[]}

type OwnershipSnapshot = {
  instances: Set<DOMComponent<unknown>>
  content: Map<DomContentInstance, () => void>
}

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
      for (const {node, parent, before} of [...origins].reverse()) {
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
    if (value instanceof DOMGroup || value instanceof Node) {
      this.commitNodes(this.retainedNodes(value), value)
      return
    }
    if (isConstruction(value)) {
      this.commitConstruction(value)
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
    const node = this.context().document.createTextNode(next)
    const previous = this.current
    const owned = this.ownedInstances()
    replaceDomRangeContent(this.start, this.anchor, [node])
    this.current = {type: "text", node}
    this.release(previous, owned)
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
    validateDomNodes(this.anchor.ownerDocument!, nodes, this.anchor)
  }

  private retainedNodes(value: NativeContent): readonly Node[] {
    if (value instanceof DocumentFragment && value.childNodes.length === 0 &&
      this.current.type === "nodes" && this.current.source === value) return this.current.nodes
    return snapshotDomNodes(value)
  }

  private owns(node: Node): boolean {
    if (node.parentNode !== this.anchor.parentNode) return false
    for (let cursor = this.start.nextSibling; cursor && cursor !== this.anchor; cursor = cursor.nextSibling) if (cursor === node) return true
    return false
  }

  private ownsInstance(instance: DOMComponent<unknown>): boolean {
    const nodes = instance instanceof DOMGroup ? instance.insertionNodes : [instance]
    return nodes.every(node => this.owns(node))
  }

  private ownedInstances(result: OwnershipSnapshot = {instances: new Set(), content: new Map()}): OwnershipSnapshot {
    if (this.current.type === "construction" && this.ownsInstance(this.current.instance)) result.instances.add(this.current.instance)
    else if (this.current.type === "content" && this.current.instance.prepareDispose) result.content.set(this.current.instance, this.current.instance.prepareDispose())
    else if (this.current.type === "array") for (const item of this.current.items) item.ownedInstances(result)
    return result
  }

  prepareDispose(): () => void {
    const previous = this.current
    const owned = this.ownedInstances()
    let active = true
    return () => {
      if (!active) return
      active = false
      if (this.start.parentNode && this.start.parentNode === this.anchor.parentNode) replaceDomRangeContent(this.start, this.anchor, [])
      this.current = {type: "empty"}
      try { this.release(previous, owned) } finally {
        this.start.parentNode?.removeChild(this.start)
        this.anchor.parentNode?.removeChild(this.anchor)
      }
    }
  }

  private matchesNodes(nodes: readonly Node[]): boolean {
    let cursor = this.start.nextSibling
    for (const node of nodes) {
      if (cursor !== node) return false
      cursor = cursor.nextSibling
    }
    return cursor === this.anchor
  }

  private commitNodes(nodes: readonly Node[], source?: NativeContent | null): void {
    this.validateNodes(nodes)
    const previous = this.current
    const owned = this.ownedInstances()
    if (!this.matchesNodes(nodes)) replaceDomRangeContent(this.start, this.anchor, nodes)
    this.current = {type: "nodes", nodes, source}
    this.release(previous, owned)
  }

  private commitConstruction(value: DOMConstruction): void {
    const key = value.key ?? null
    if (key !== null && typeof key !== "string" && typeof key !== "number") throw new TypeError("DOM component key must be a string or number")
    if (this.current.type === "construction" && this.current.constructor === value.type && Object.is(this.current.key, key) && this.ownsInstance(this.current.instance)) {
      this.current.instance.update(value.props, value.content, value.context)
      return
    }
    const {document} = this.context()
    const restore = captureDomOrigins(document, value.content)
    const previous = this.current
    const owned = this.ownedInstances()
    let instance: DOMComponent<unknown> | undefined
    try {
      instance = new value.type(document, value.props, value.content, value.context)
      if (!(instance instanceof Element || instance instanceof DOMGroup)) throw new TypeError("DOM constructor must return an actual Element or DOMGroup")
      const nodes = instance instanceof DOMGroup ? instance.insertionNodes : [instance]
      this.validateNodes(nodes)
      replaceDomRangeContent(this.start, this.anchor, [instance])
    } catch (error) {
      const errors = [error]
      try { restore.restore() } catch (rollback) { errors.push(rollback) }
      try { instance?.dispose() } catch (cleanup) { errors.push(cleanup) }
      if (errors.length > 1) throw new AggregateError(errors, "DOM construction rollback failed")
      throw error
    }
    restore.restoreFocus()
    this.current = {type: "construction", instance, constructor: value.type, key}
    this.release(previous, owned)
  }

  private clear(): void {
    const previous = this.current
    const owned = this.ownedInstances()
    if (this.start.parentNode && this.start.parentNode === this.anchor.parentNode) replaceDomRangeContent(this.start, this.anchor, [])
    this.current = {type: "empty"}
    this.release(previous, owned)
  }

  private release(current: RegionValue, owned: OwnershipSnapshot): void {
    if (current.type === "construction") {
      if (owned.instances.has(current.instance) && current.instance.parentNode === null) current.instance.dispose()
    } else if (current.type === "content") (owned.content.get(current.instance) ?? (() => current.instance.dispose()))()
    else if (current.type === "array") {
      const errors: unknown[] = []
      for (const item of current.items) {
        const previous = item.current
        item.current = {type: "empty"}
        try { item.release(previous, owned) } catch (error) { errors.push(error) }
        item.start.parentNode?.removeChild(item.start)
        item.anchor.parentNode?.removeChild(item.anchor)
      }
      if (errors.length) throw errors[0]
    }
  }

  private context(): {document: Document, parent: Element | DocumentFragment} {
    const parent = this.anchor.parentNode
    const document = this.anchor.ownerDocument
    if (!(parent instanceof Element || parent instanceof DocumentFragment) || !document) throw new Error("DOM content range is detached")
    return {document, parent}
  }
}

function isConstruction(value: unknown): value is DOMConstruction {
  return typeof value === "object" && value !== null && isDOMComponentConstructor((value as Partial<DOMConstruction>).type)
}
