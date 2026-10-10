import type {Document} from "../document.ts"
import type {Node} from "../node.ts"
import type {Element} from "../element.ts"
import type {HTMLElement} from "../html-element.ts"
import type {CustomDefinition, CustomCallbacks} from "./custom-elements.ts"
import type {ConnectionTarget, ConnectionCallbacks, ConnectionScope} from "../../contract/connection.ts"
import {requestDOMWork, connectionCommitAllowed} from "./dom-work.ts"
import {nativePropertyAttributes, nativePropertyProjections} from "./native-properties.ts"

export type CustomState = {
  registry: object
  definition?: CustomDefinition
  status: "undefined" | "precustomized" | "custom" | "failed"
  upgrade(): void
  is: string | null
}
type Connection = {
  target: ConnectionTarget
  callbacks: ConnectionCallbacks
  document: Document
  connected: boolean
  disposed: boolean
  nodes: readonly Node[]
  pendingDocument: Document | null
  attributes: ReadonlySet<string> | undefined
  properties: ReadonlySet<string> | undefined
  changed: boolean
  changesSuppressed: number
  contentInterest: {active: boolean} | undefined
}
type Record = {
  count: number
  customCount: number
  custom?: CustomState
  customTracked?: boolean
  connections?: Set<Connection>
  attributes?: Map<string, Set<Connection>>
  properties?: Map<string, Set<Connection>>
  movingTo?: Document
}

// Один индекс интересов, один обход ветвей и одна очередь reactions для всех DOM-владельцев.
const records = new WeakMap<Node, Record>()
let reactions: Array<(() => void) | Connection> = []
const pending = new WeakMap<Document, number>()
let depth = 0
let flushing = false
let contentObservers = 0
let contentFinalizer: FinalizationRegistry<{active: boolean}> | undefined

export function readCustomState(element: Element): CustomState | undefined { return records.get(element)?.custom }
export function trackCustomState(element: Element, custom: CustomState): void {
  const record = ensure(element)
  if (record.custom) return
  record.custom = custom
  record.customTracked = true
  adjust(element, 1, 1)
}
export function failCustomState(element: Element): void {
  const record = records.get(element)
  if (!record?.custom) return
  record.custom.status = "failed"
  if (record.customTracked) {
    record.customTracked = false
    adjust(element, -1, -1)
  }
}
export function visitCustomLifecycle(root: Node, visit: (element: HTMLElement) => void): void {
  walk(root, (node, record) => { if (record.custom) visit(node as HTMLElement) }, true)
}

export function observeDOMConnection(target: ConnectionTarget, nodes: readonly Node[], callbacks: ConnectionCallbacks): ConnectionScope {
  const document = targetDocument(target)
  if (!document) throw new TypeError("Connection target must have an ownerDocument")
  for (const [name, callback] of Object.entries(callbacks)) {
    if (name === "attributes" || name === "properties") continue
    if (callback !== undefined && typeof callback !== "function") throw new TypeError("Connection callback must be a function")
  }
  const names = (value: readonly string[] | undefined, attributes: boolean): Set<string> | undefined => {
    if (value === undefined) return undefined
    if (!Array.isArray(value) || value.some(name => typeof name !== "string" || name.length === 0)) throw new TypeError("Connection change filters must be arrays of nonempty names")
    return value.length ? new Set(value.map(name => attributes ? name.toLowerCase() : name)) : undefined
  }
  let attributes = names(callbacks.attributes, true)
  const properties = names(callbacks.properties, false)
  if ((attributes || properties) && (nodes.length !== 1 || nodes[0] !== target)) throw new TypeError("Connection change filters require a Node target")
  if ((attributes || properties) && !callbacks.changed) throw new TypeError("Connection change filters require a changed callback")
  for (const name of properties ?? []) {
    for (const attribute of nativePropertyAttributes(target, name)) (attributes ??= new Set()).add(attribute)
  }
  const localName = "localName" in target ? target.localName : null
  const contentObserved = properties !== undefined && [...properties].some(name =>
    name === "textContent" || name === "innerHTML" || localName === "textarea" && (name === "value" || name === "defaultValue") ||
    localName === "option" && (name === "value" || name === "label") || localName === "select" && (name === "value" || name === "selectedIndex"))
  const contentInterest = contentObserved ? {active: true} : undefined
  const connection: Connection = {target, callbacks, document, connected: false, disposed: false, nodes, pendingDocument: null,
    attributes, properties, changed: false, changesSuppressed: 0, contentInterest}
  if (contentInterest) {
    contentObservers++
    contentFinalizer ??= new FinalizationRegistry(interest => {
      if (interest.active) {
        interest.active = false
        contentObservers--
      }
    })
    contentFinalizer.register(connection, contentInterest, connection)
  }
  for (const node of nodes) {
    const record = ensure(node)
    const connections = record.connections ??= new Set()
    connections.add(connection)
    for (const key of ["attributes", "properties"] as const) {
      if (!connection[key]) continue
      const index = record[key] ??= new Map()
      for (const name of connection[key]!) {
        const observers = index.get(name) ?? new Set()
        observers.add(connection)
        index.set(name, observers)
      }
    }
    adjust(node, 1, 0)
  }
  schedule(connection, document)
  return {suppressChanges(callback) {
    connection.changesSuppressed++
    try { return callback() } finally { connection.changesSuppressed-- }
  }, dispose() {
    if (connection.disposed) return
    connection.disposed = true
    if (connection.contentInterest?.active) {
      connection.contentInterest.active = false
      contentObservers--
      contentFinalizer?.unregister(connection)
    }
    for (const node of nodes) {
      const record = records.get(node)
      record?.connections?.delete(connection)
      for (const key of ["attributes", "properties"] as const) {
        const index = record?.[key]
        if (!index || !connection[key]) continue
        for (const name of connection[key]!) {
          const observers = index.get(name)
          observers?.delete(connection)
          if (!observers?.size) index.delete(name)
        }
      }
      adjust(node, -1, 0)
    }
    if (connection.connected) {
      connection.connected = false
      connection.callbacks.disconnected?.()
    }
  }}
}

export function observesDOMAttribute(node: Node, name: string): boolean { return records.get(node)?.attributes?.has(name) ?? false }
export function observesDOMProperty(node: Node, name: string): boolean { return records.get(node)?.properties?.has(name) ?? false }
export function observesDOMContent(): boolean { return contentObservers !== 0 }
export function lifecycleAttributeChanged(node: Node, name: string): void { notifyChange(node, name, "attributes") }
export function lifecyclePropertyChanged(node: Node, name: string): void {
  const projections = nativePropertyProjections[name]
  if (projections) for (const property of projections) notifyChange(node, property, "properties")
  else notifyChange(node, name, "properties")
}
export function lifecycleContentChanged(node: Node): void {
  if (!contentObservers) return
  for (let current: Node | null = node; current; current = current.parentNode) {
    notifyChange(current, "textContent", "properties")
    notifyChange(current, "innerHTML", "properties")
    if ("localName" in current && current.localName === "textarea") {
      notifyChange(current, "defaultValue", "properties")
      notifyChange(current, "value", "properties")
    }
    if ("localName" in current && current.localName === "option") {
      notifyChange(current, "label", "properties")
      notifyChange(current, "value", "properties")
    }
    if ("localName" in current && current.localName === "select") {
      notifyChange(current, "value", "properties")
      notifyChange(current, "selectedIndex", "properties")
    }
  }
}
function notifyChange(node: Node, name: string, key: "attributes" | "properties"): void {
  const observers = records.get(node)?.[key]?.get(name)
  if (!observers) return
  for (const connection of observers) {
    if (connection.disposed || connection.changesSuppressed) continue
    connection.changed = true
    schedule(connection, node.ownerDocument!)
  }
}

export function lifecycleInserted(root: Node): void {
  const record = records.get(root)
  if (!record?.count) return
  const document = root.ownerDocument!
  const stableMove = record.movingTo === document && root.isConnected
  delete record.movingTo
  adjust(root.parentNode, record.count, record.customCount)
  walk(root, (node, current) => {
    if (node.isConnected && current.custom) {
      if (current.custom.status === "undefined") current.custom.upgrade()
      else enqueueCustomLifecycle(node as HTMLElement, "connectedCallback")
    }
    if (!stableMove) for (const connection of current.connections ?? []) schedule(connection, document)
  }, stableMove)
}
export function lifecycleRemoving(root: Node, destination: Document | null, moving?: ReadonlySet<Node>): void {
  const record = records.get(root)
  if (!record?.count) return
  const document = root.ownerDocument!
  let stableMove = root.isConnected && document === destination
  // Отдельное перемещение одной границы не является перемещением всей группы.
  if (stableMove && record.connections) {
    for (const connection of record.connections) {
      if (!connection.nodes.every(node => root.contains(node) || moving?.has(node))) stableMove = false
    }
  }
  if (stableMove) record.movingTo = document
  else delete record.movingTo
  const connected = root.isConnected
  walk(root, (node, current) => {
    if (connected && current.custom) enqueueCustomLifecycle(node as HTMLElement, "disconnectedCallback")
    if (!stableMove) for (const connection of current.connections ?? []) schedule(connection, document)
  }, stableMove)
  adjust(root.parentNode, -record.count, -record.customCount)
}
export function lifecycleAdopted(node: Node, previous: Document | null, next: Document): void {
  const record = records.get(node)
  if (!record) return
  if (previous !== null && previous !== next && record.custom) enqueueCustomLifecycle(node as HTMLElement, "adoptedCallback", previous, next)
  for (const connection of record.connections ?? []) schedule(connection, next)
}

export function enqueueCustomLifecycle(element: HTMLElement, name: keyof CustomCallbacks, ...arguments_: unknown[]): void {
  const custom = records.get(element)?.custom
  if (custom?.status !== "custom") return
  const callback = custom.definition?.callbacks[name]
  if (callback) reactions.push(() => {
    try { Reflect.apply(callback, element, arguments_) } catch (error) { reportLifecycleError(error) }
  })
}
export function beginDOMReactions(): void { depth++ }
export function endDOMReactions(): void {
  depth--
  flushDOMReactions()
}
export function hasDOMReactions(document: Document): boolean { return (pending.get(document) ?? 0) !== 0 }
export function isFlushingDOMReactions(): boolean { return flushing }
export function isDOMReactionBatchOpen(): boolean { return depth !== 0 }
export function clearDOMChanges(document: Document): void {
  for (const reaction of reactions) if (typeof reaction !== "function" && reaction.pendingDocument === document) reaction.changed = false
}

/** CE records сохраняют порядок; connection targets сравниваются после завершения native reactions. */
export function flushDOMReactions(): void {
  if (depth !== 0 || flushing || !reactions.length) return
  flushing = true
  const connections: Connection[] = []
  const deferred: Connection[] = []
  let changedTargets: Set<Connection> | undefined
  let offset = 0
  let failed = false
  let firstError: unknown
  try {
    while (reactions.length || offset < connections.length) {
      while (reactions.length) {
        const queued = reactions
        reactions = []
        for (const reaction of queued) {
          if (typeof reaction === "function") reaction()
          else connections.push(reaction)
        }
      }
      while (offset < connections.length) {
        const connection = connections[offset++]!
        const document = connection.pendingDocument
        if (document && !document[connectionCommitAllowed]()) {
          deferred.push(connection)
          continue
        }
        if (connection.changed) {
          if (changedTargets?.has(connection)) {
            deferred.push(connection)
            continue
          }
          (changedTargets ??= new Set()).add(connection)
        }
        connection.pendingDocument = null
        if (document) pending.set(document, (pending.get(document) ?? 1) - 1)
        try { flushConnection(connection) } catch (error) {
          if (!failed) {
            failed = true
            firstError = error
          }
        }
        if (reactions.length) break
      }
    }
  } finally {
    reactions.push(...deferred)
    flushing = false
  }
  if (failed) throw firstError
}
export function reportLifecycleError(error: unknown): void {
  if (typeof globalThis.reportError === "function") globalThis.reportError(error)
  else queueMicrotask(() => { throw error })
}

function flushConnection(connection: Connection): void {
  if (connection.disposed) return
  const changed = connection.changed
  connection.changed = false
  const previous = connection.document
  const next = targetDocument(connection.target)!
  const connected = connection.target.isConnected
  const adopted = previous !== next
  const wasConnected = connection.connected
  connection.document = next
  const errors: unknown[] = []
  const invoke = (callback: (() => void) | undefined) => { try { callback?.() } catch (error) { errors.push(error) } }
  if (wasConnected && (!connected || adopted)) {
    connection.connected = false
    invoke(connection.callbacks.disconnected)
  }
  if (adopted && !connection.disposed) invoke(() => connection.callbacks.adopted?.(previous, next))
  if (connected && (!wasConnected || adopted) && !connection.disposed) {
    connection.connected = true
    invoke(connection.callbacks.connected)
  }
  if (changed && !connection.disposed) invoke(connection.callbacks.changed)
  if (errors.length) throw errors[0]
}
function schedule(connection: Connection, document: Document): void {
  if (connection.disposed || connection.pendingDocument) return
  connection.pendingDocument = document
  pending.set(document, (pending.get(document) ?? 0) + 1)
  reactions.push(connection)
  document[requestDOMWork]()
}
function targetDocument(target: ConnectionTarget): Document | null {
  return target.ownerDocument ?? ("nodeType" in target && target.nodeType === 9 ? target as Document : null)
}
function ensure(node: Node): Record {
  let record = records.get(node)
  if (!record) records.set(node, record = {count: 0, customCount: 0})
  return record
}
function adjust(node: Node | null, difference: number, customDifference: number): void {
  for (let current = node; current; current = current.parentNode) {
    const record = ensure(current)
    record.count += difference
    record.customCount += customDifference
    if (record.count === 0 && !record.custom && !record.connections?.size) records.delete(current)
  }
}
function walk(root: Node, visit: (node: Node, record: Record) => void, customOnly = false): void {
  const record = records.get(root)
  if (!record || !(customOnly ? record.customCount : record.count)) return
  visit(root, record)
  for (let child = root.firstChild; child; child = child.nextSibling) walk(child, visit, customOnly)
}
