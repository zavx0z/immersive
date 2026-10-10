import {expect, test} from "bun:test"
import {createDocument, DOMGroup, HTMLElement, observeConnection} from "../src/index.ts"

test("Detached insertion/removal сохраняют interests до первого подключения", () => {
  const document = createDocument(), root = document.createElement("main")
  const staging = document.createDocumentFragment()
  const left = document.createElement("section"), right = document.createElement("section")
  const child = document.createElement("button"), calls: string[] = []
  document.append(root)
  staging.append(left, right)
  const scope = observeConnection(child, {
    connected() { calls.push("connected") },
    disconnected() { calls.push("disconnected") }
  })
  document.transaction(() => {
    left.append(child)
    child.remove()
    right.append(child)
  })
  expect(calls).toEqual([])
  root.append(staging)
  expect(calls).toEqual(["connected"])
  expect(child.parentNode).toBe(right)
  right.remove()
  expect(calls).toEqual(["connected", "disconnected"])
  scope.dispose()
  expect(calls).toEqual(["connected", "disconnected"])
})

test("Pending parent disconnect переживает detached child removal и native change", () => {
  const document = createDocument(), root = document.createElement("main")
  const parent = document.createElement("section"), child = document.createElement("button")
  const calls: string[] = []
  document.append(root)
  root.append(parent)
  parent.append(child)
  const scope = observeConnection(child, {
    attributes: ["title"],
    connected() { calls.push("connected") },
    disconnected() { calls.push("disconnected") },
    changed() { calls.push("changed") }
  })
  document.flushTasks()
  calls.length = 0
  document.transaction(() => {
    parent.remove()
    child.remove()
    child.title = "detached"
    expect(calls).toEqual([])
  })
  expect(calls).toEqual(["disconnected", "changed"])
  document.transaction(() => {
    parent.append(child)
    root.append(parent)
  })
  expect(calls).toEqual(["disconnected", "changed", "connected"])
  scope.dispose()
})

test("Detached→connected placement и connected same-Document reparent сохраняют identity/state/focus", () => {
  const document = createDocument(), root = document.createElement("main")
  const left = document.createElement("section"), right = document.createElement("section")
  const staging = document.createDocumentFragment(), input = document.createElement("input")
  const calls: string[] = []
  document.append(root)
  root.append(left, right)
  input.value = "owned"
  staging.append(input)
  const scope = observeConnection(input, {
    connected() { calls.push("connected") },
    disconnected() { calls.push("disconnected") }
  })
  left.append(input)
  input.focus()
  right.append(input)
  expect(calls).toEqual(["connected"])
  expect(right.firstChild).toBe(input)
  expect(document.activeElement).toBe(input)
  expect(input.value).toBe("owned")
  staging.append(input)
  expect(calls).toEqual(["connected", "disconnected"])
  expect(document.activeElement).toBeNull()
  left.append(input)
  expect(calls).toEqual(["connected", "disconnected", "connected"])
  expect(input.value).toBe("owned")
  scope.dispose()
})

test("DOMGroup сохраняет anchors/interests через detached teardown и повторное подключение", () => {
  const document = createDocument(), root = document.createElement("main")
  const staging = document.createDocumentFragment()
  const left = document.createElement("section"), right = document.createElement("section")
  const input = document.createElement("input"), group = new DOMGroup(document, input)
  const calls: string[] = []
  document.append(root)
  staging.append(left, right)
  const scope = observeConnection(group, {
    connected() { calls.push("connected") },
    disconnected() { calls.push("disconnected") }
  })
  left.append(group)
  right.append(group)
  expect(calls).toEqual([])
  root.append(staging)
  expect(calls).toEqual(["connected"])
  input.focus()
  left.append(group)
  expect(document.activeElement).toBe(input)
  expect(calls).toEqual(["connected"])
  document.transaction(() => {
    left.remove()
    group.remove()
  })
  expect(calls).toEqual(["connected", "disconnected"])
  expect(group.isConnected).toBe(false)
  right.append(group)
  expect(calls).toEqual(["connected", "disconnected", "connected"])
  expect(group.nodes).toEqual([input])
  scope.dispose()
})

test("Native CE callbacks и adopted reactions сохраняются при detached placement", () => {
  const first = createDocument(), second = createDocument()
  const firstRoot = first.createElement("main"), secondRoot = second.createElement("main")
  const parent = first.createElement("section"), staging = second.createDocumentFragment()
  const native: string[] = [], scopes: string[] = []
  first.append(firstRoot)
  second.append(secondRoot)
  class Panel extends HTMLElement {
    static observedAttributes = ["title"]
    connectedCallback() { native.push("connected") }
    disconnectedCallback() { native.push("disconnected") }
    attributeChangedCallback() { native.push("attribute") }
    adoptedCallback(previous: typeof first, next: typeof second) {
      expect(previous).toBe(first)
      expect(next).toBe(second)
      native.push("adopted")
    }
  }
  first.customElementRegistry.define("detached-lifecycle-panel", Panel)
  const element = first.createElement("detached-lifecycle-panel")
  const scope = observeConnection(element, {
    connected() { scopes.push("connected") },
    disconnected() { scopes.push("disconnected") },
    adopted(previous, next) {
      expect(previous).toBe(first)
      expect(next).toBe(second)
      scopes.push("adopted")
    }
  })
  parent.append(element)
  element.remove()
  parent.append(element)
  expect(native).toEqual([])
  expect(scopes).toEqual([])
  firstRoot.append(parent)
  expect(native).toEqual(["connected"])
  expect(scopes).toEqual(["connected"])
  first.transaction(() => {
    parent.remove()
    element.remove()
    element.setAttribute("title", "detached")
  })
  expect(native).toEqual(["connected", "disconnected", "attribute"])
  expect(scopes).toEqual(["connected", "disconnected"])
  staging.append(element)
  expect(native).toEqual(["connected", "disconnected", "attribute", "adopted"])
  expect(scopes).toEqual(["connected", "disconnected", "adopted"])
  expect(element.ownerDocument).toBe(second)
  secondRoot.append(staging)
  expect(native).toEqual(["connected", "disconnected", "attribute", "adopted", "connected"])
  expect(scopes).toEqual(["connected", "disconnected", "adopted", "connected"])
  scope.dispose()
})
