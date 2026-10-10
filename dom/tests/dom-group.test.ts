import {expect, test} from "bun:test"
import {
  createDocument, DOMGroup, Node, HTMLDivElement, observeConnection,
  acquireDocumentCompiledStyleSheets, readDocumentCompiledStyleSheets,
  domComponentConstructorBrand
} from "../src/index.ts"
import type {DOMComponentConstructor, Document} from "../src/index.ts"

function fixture() {
  const document = createDocument()
  const root = document.createElement("main")
  const left = document.createElement("div"), right = document.createElement("div")
  root.append(left, right)
  document.append(root)
  return {document, root, left, right}
}

test("DOMGroup вставляет только реальные Nodes, сохраняет диапазон и внешних соседей", () => {
  const {document, left, right} = fixture()
  const button = document.createElement("button"), text = document.createTextNode("text")
  const group = new DOMGroup(document, button, text)
  expect(group instanceof Node).toBe(false)
  expect(group.nodes).toEqual([button, text])
  expect(group.parentNode).toBeNull()
  left.append("before", group, "after")
  expect(left.childNodes).toEqual([left.firstChild!, ...group.insertionNodes, left.lastChild!])
  expect(group.parentNode).toBe(left)
  expect(group.previousSibling?.textContent).toBe("before")
  expect(group.nextSibling?.textContent).toBe("after")
  expect(button.parentNode).toBe(left)
  button.focus()
  right.appendChild(group)
  expect(group.nodes).toEqual([button, text])
  expect(document.activeElement).toBe(button)
  expect(group.isConnected).toBe(true)
  expect(right.removeChild(group)).toBe(group)
  expect(group.parentNode).toBeNull()
  expect(group.isConnected).toBe(false)
  expect(group.nodes).toEqual([button, text])
  expect(document.activeElement).toBeNull()
  left.insertBefore(group, left.lastChild)
  const empty = new DOMGroup(document)
  left.insertBefore(empty, group)
  expect(empty.nextSibling).toBe(group.insertionNodes[0]!)
  expect(empty.insertionNodes).toHaveLength(2)
  expect(Object.isFrozen(group.nodes)).toBe(true)
})

test("replaceChildren/textContent сохраняют удалённые и вложенные группы для повторного применения", () => {
  const {document, left, right} = fixture()
  const inner = new DOMGroup(document, "inner")
  const outer = new DOMGroup(document, "before", inner, "after")
  left.append(outer)
  left.replaceChildren(inner)
  expect(left.textContent).toBe("inner")
  expect(outer.nodes.map(node => node.textContent)).toEqual(["before", "after"])
  expect(outer.parentNode).toBeNull()
  right.append(outer)
  right.textContent = "replacement"
  expect(outer.nodes.map(node => node.textContent)).toEqual(["before", "after"])
  expect(outer.parentNode).toBeNull()
  outer.replaceChildren(inner)
  expect(outer.nodes).toEqual(inner.insertionNodes)
  left.append(outer)
  expect(left.textContent).toBe("inner")
  outer.replaceChildren()
  expect(inner.nodes[0]!.textContent).toBe("inner")
  left.append(inner)
  expect(left.textContent).toBe("inner")
})

test("group replacement validates native Space before moving existing content or emitting mutations", () => {
  const {document, left} = fixture()
  const space = document.createElement("space")
  left.append(space)
  const viewpoint = document.createElement("viewpoint")
  const group = new DOMGroup(document, viewpoint)
  space.append(group)
  const invalid = document.createElement("button")
  left.append(invalid)
  const before = [...space.childNodes], batches: unknown[] = []
  document.subscribeMutations(batch => batches.push(batch))
  expect(() => group.replaceChildren(invalid)).toThrow("Space accepts only spatial elements")
  expect(space.childNodes).toEqual(before)
  expect(group.nodes).toEqual([viewpoint])
  expect(invalid.parentNode).toBe(left)
  expect(batches).toEqual([])
  const candidate = new DOMGroup(document, document.createElement("display"), invalid)
  batches.length = 0
  expect(() => space.append(candidate)).toThrow("Space accepts only spatial elements")
  expect(candidate.parentNode).toBeNull()
  expect(space.childNodes).toEqual(before)
  expect(batches).toEqual([])
  expect(() => group.append(group)).toThrow()
  const boundary = group.insertionNodes[0]!
  space.removeChild(boundary)
  expect(() => group.remove()).toThrow("DOMGroup boundaries must share one parent")
})

test("Node и Group connection scope объединяют транзакции и сохраняют same-Document reparent", () => {
  const {document, left, right} = fixture()
  const button = document.createElement("button"), group = new DOMGroup(document, button)
  const calls: string[] = []
  const scope = observeConnection(group, {
    connected() { expect(group.isConnected).toBe(true); calls.push("connect") },
    disconnected() { calls.push("disconnect") },
    adopted(previous, next) { expect(previous).toBe(document); expect(next).not.toBe(document); calls.push("adopt") }
  })
  observeConnection(button, {connected() { calls.push("node-connect") }, disconnected() { calls.push("node-disconnect") }})
  document.transaction(() => { left.append(group); group.moveTo(right); group.remove(); left.append(group) })
  expect(calls).toEqual(["connect", "node-connect"])
  right.append(group)
  expect(calls).toEqual(["connect", "node-connect"])
  const other = fixture()
  other.left.append(group)
  expect(calls).toEqual(["connect", "node-connect", "disconnect", "adopt", "connect", "node-disconnect", "node-connect"])
  expect(group.ownerDocument).toBe(other.document)
  expect(group.nodes).toEqual([button])
  scope.dispose()
  scope.dispose()
  expect(calls.at(-1)).toBe("disconnect")
  group.remove()
  other.left.append(group)
  expect(calls.filter(call => call === "connect")).toHaveLength(2)
})

test("direct generated Element and Group subclasses share existing stylesheet lease and DOM lifecycle", () => {
  const {document, left, right} = fixture()
  const authored = {kind: "authored-css" as const, moduleId: "counter.tsx", componentName: "Counter", cssText: "button{color:red}"}
  const sheet = {id: "counter", cssText: authored.cssText, source: authored}
  class Counter extends HTMLDivElement {
    static readonly [domComponentConstructorBrand] = true as const
    props: Readonly<{count: number}>
    content = {}
    private lease: ReturnType<typeof acquireDocumentCompiledStyleSheets> | undefined
    private readonly scope
    constructor(document: Document, props: Readonly<{count: number}>) {
      super(document)
      this.props = props
      this.textContent = String(props.count)
      this.scope = observeConnection(this, {
        connected: () => { this.lease = acquireDocumentCompiledStyleSheets(this.ownerDocument!, [sheet]) },
        disconnected: () => { this.lease?.release(); this.lease = undefined }
      })
    }
    update(props: Readonly<{count: number}>) { this.props = props; this.textContent = String(props.count) }
    dispose() { this.scope.dispose(); this.remove() }
  }
  const Constructor: DOMComponentConstructor<{count: number}> = Counter
  const first = new Constructor(document, {count: 1}), second = new Counter(document, {count: 2})
  class Pair extends DOMGroup {}
  const pair = new Pair(document, first, second)
  left.append(pair)
  expect(first).toBeInstanceOf(HTMLDivElement)
  expect(readDocumentCompiledStyleSheets(document).styleSheets).toEqual([sheet])
  expect(Object.isFrozen(readDocumentCompiledStyleSheets(document).styleSheets[0]!.source)).toBe(true)
  pair.moveTo(right)
  expect(readDocumentCompiledStyleSheets(document).styleSheets).toHaveLength(1)
  first.update({count: 3})
  expect(right.textContent).toBe("32")
  first.dispose()
  expect(readDocumentCompiledStyleSheets(document).styleSheets).toHaveLength(1)
  second.dispose()
  expect(readDocumentCompiledStyleSheets(document).styleSheets).toEqual([])
})

test("compiled stylesheet provenance is copied immutably and collisions leave the active lease intact", () => {
  const document = createDocument()
  const source = {kind: "authored-css" as const, moduleId: "one.tsx", componentName: "One", cssText: ".one{color:red}"}
  const sheet = {id: "one", cssText: source.cssText, source}
  const lease = acquireDocumentCompiledStyleSheets(document, [sheet])
  source.componentName = "mutated"
  const current = readDocumentCompiledStyleSheets(document)
  expect(current.styleSheets[0]!.source!.componentName).toBe("One")
  expect(() => acquireDocumentCompiledStyleSheets(document, [sheet])).toThrow("collision")
  expect(() => acquireDocumentCompiledStyleSheets(document, [{...sheet, source: {kind: "foreign"} as never}])).toThrow("provenance")
  expect(readDocumentCompiledStyleSheets(document)).toBe(current)
  const duplicate = acquireDocumentCompiledStyleSheets(document, [current.styleSheets[0]!])
  lease.release()
  expect(readDocumentCompiledStyleSheets(document).styleSheets).toHaveLength(1)
  duplicate.release()
  expect(readDocumentCompiledStyleSheets(document).styleSheets).toEqual([])
})

test("replaceDomRangeContent swaps only the selected native range after complete replacement preflight", async () => {
  const {replaceDomRangeContent} = await import("../src/index.ts")
  const document = createDocument(), space = document.createElement("space")
  document.append(space)
  const before = document.createElement("display"), after = document.createElement("display")
  const start = document.createComment("start"), end = document.createComment("end")
  const old = document.createElement("viewpoint")
  space.append(before, start, old, end, after)
  const next = new DOMGroup(document, document.createElement("viewpoint"))
  replaceDomRangeContent(start, end, [next])
  expect(space.childNodes).toEqual([before, start, ...next.insertionNodes, end, after])
  expect(old.parentNode).toBeNull()
  const invalid = document.createElement("button"), snapshot = [...space.childNodes]
  expect(() => replaceDomRangeContent(start, end, [invalid])).toThrow("Space accepts only spatial elements")
  expect(space.childNodes).toEqual(snapshot)
  expect(invalid.parentNode).toBeNull()
  replaceDomRangeContent(start, end, [])
  expect(next.parentNode).toBeNull()
  expect(next.nodes).toHaveLength(1)
  expect(space.childNodes).toEqual([before, start, end, after])
  expect(() => replaceDomRangeContent(end, start, [])).toThrow("order")
})
