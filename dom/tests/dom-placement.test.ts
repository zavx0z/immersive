import {expect, test} from "bun:test"
import {createDocument, DOMGroup, HTMLElement, HTMLDivElement, captureDomOrigins, replaceDomRangeContent, validateDomNodes, snapshotDomNodes, observeConnection, domComponentConstructorBrand} from "../src/index.ts"

function fixture() {
  const document = createDocument(), main = document.createElement("main")
  const left = document.createElement("div"), right = document.createElement("div")
  main.append(left, right)
  document.append(main)
  return {document, left, right}
}

test("общий snapshot сохраняет whole Group, Fragment inputs и только construction content", () => {
  const {document, left, right} = fixture()
  const button = document.createElement("button"), group = new DOMGroup(document, button)
  const fragment = document.createDocumentFragment(), detached = document.createElement("span"), ignored = document.createElement("input")
  fragment.append(detached)
  left.append("before", group, "after")
  const original = [...left.childNodes]
  button.focus()
  class Ready extends HTMLDivElement { static readonly [domComponentConstructorBrand] = true as const }
  const snapshot = captureDomOrigins(document, {"": group, header: fragment, nested: {type: Ready, props: {ignored}, content: {raw: button}}})
  expect(snapshot.nodes).toEqual([...group.insertionNodes, detached])
  expect(snapshot.nodes.includes(ignored)).toBe(false)
  expect(Object.isFrozen(snapshot.nodes)).toBe(true)
  right.append(group, fragment)
  // Даже отдельно вынутый child возвращается между исходными границами Group.
  left.append(button)
  snapshot.restore()
  expect(left.childNodes).toEqual(original)
  expect(group.nodes).toEqual([button])
  expect(fragment.childNodes).toEqual([detached])
  expect(document.activeElement === button).toBe(true)
  const version = document.version
  snapshot.restore()
  expect(document.version).toBe(version)
  expect(snapshotDomNodes(group)).toEqual(group.insertionNodes)
})

test("physical rollback не зависит от порядка raw inputs и восстанавливает siblings", () => {
  const {document, left, right} = fixture()
  const first = document.createElement("a"), second = document.createElement("b"), third = document.createElement("c")
  left.append(first, second, third)
  const snapshot = captureDomOrigins(document, [third, first, second])
  right.append(second, third, first)
  snapshot.restore()
  expect(left.childNodes).toEqual([first, second, third])
  expect(right.childNodes).toEqual([])
})

test("общая physical validation отклоняет foreign, repeated и cyclic Nodes", () => {
  const {document, left} = fixture()
  const other = createDocument()
  expect(() => validateDomNodes(document, [other.createElement("button")])).toThrow("receiving Document")
  expect(() => validateDomNodes(document, [left, left])).toThrow("repeat")
  expect(() => validateDomNodes(document, [left], left)).toThrow("receiving range")
})

test("keyed physical placement не трогает стабильные Nodes и доставляет CE callbacks только для moved Node", () => {
  const {document, left} = fixture()
  const calls: string[] = []
  class Item extends HTMLElement {
    connectedCallback() { calls.push(`connect:${this.id}`) }
    disconnectedCallback() { calls.push(`disconnect:${this.id}`) }
  }
  document.customElementRegistry.define("x-item", Item)
  const start = document.createComment("start"), end = document.createComment("end")
  const items = ["a", "b", "c"].map(id => {
    const element = document.createElement("x-item")
    element.id = id
    return element
  })
  left.append(start, ...items, end)
  calls.length = 0
  const version = document.version
  replaceDomRangeContent(start, end, items)
  expect(calls).toEqual([])
  expect(document.version).toBe(version)
  replaceDomRangeContent(start, end, [items[1]!, items[2]!, items[0]!])
  expect(left.children).toEqual([items[1]!, items[2]!, items[0]!])
  expect(calls).toEqual(["disconnect:a", "connect:a"])
})

test("same-connected move пропускает проверку observed descendants, но сохраняет native CE reactions", () => {
  const {document, left, right} = fixture()
  const subtree = document.createElement("section")
  let checked = 0, connected = 0, disconnected = 0
  class Observed extends HTMLDivElement {
    override get isConnected() {
      checked++
      return super.isConnected
    }
  }
  for (let index = 0; index < 120; index++) {
    const element = new Observed(document)
    observeConnection(element, {connected() { connected++ }, disconnected() { disconnected++ }})
    subtree.append(element)
  }
  const calls: string[] = []
  class Native extends HTMLElement {
    connectedCallback() { calls.push("connect") }
    disconnectedCallback() { calls.push("disconnect") }
  }
  document.customElementRegistry.define("x-native-item", Native)
  subtree.append(document.createElement("x-native-item"))
  left.append(subtree)
  checked = 0
  calls.length = 0
  right.append(subtree)
  expect(checked).toBe(0)
  expect([connected, disconnected]).toEqual([120, 0])
  expect(calls).toEqual(["disconnect", "connect"])
  subtree.remove()
  expect(disconnected).toBe(120)
  left.append(subtree)
  expect(connected).toBe(240)
})

test("перенос одной Group boundary не маскируется stable subtree move", () => {
  const {document, left, right} = fixture()
  const group = new DOMGroup(document, "content")
  let connections = 0, disconnections = 0
  observeConnection(group, {connected() { connections++ }, disconnected() { disconnections++ }})
  left.append(group)
  const [start, child] = group.insertionNodes
  right.append(start!)
  expect(group.isConnected).toBe(false)
  expect(disconnections).toBe(1)
  left.append(start!)
  expect(group.isConnected).toBe(false)
  left.insertBefore(start!, child!)
  expect(group.isConnected).toBe(true)
  expect(connections).toBe(2)
})
