import {expect, test} from "bun:test"
import {createDocument, DOMGroup, HTMLDivElement, HTMLButtonElement, domComponentConstructorBrand, observeConnection, Event} from "@zavx0z/immersive-dom"
import {DisplayElement} from "@zavx0z/immersive-dom/display"
import type {Document, DOMComponentContent} from "@zavx0z/immersive-dom"
import {compile, html} from "../index.ts"

function fixture() {
  const document = createDocument(), root = document.createElement("main")
  const first = document.createElement("div"), second = document.createElement("div")
  root.append(first, second)
  document.append(root)
  return {document, first, second}
}
const contentProgram = compile((state: {value: unknown}) => html`${state.value}`)

test("HTML child transfers actual generated Element/Group without disposing caller-owned objects or dropping boundaries", () => {
  const {document, first, second} = fixture()
  let disposed = 0, clicks = 0, connected = 0, disconnected = 0
  class Ready extends HTMLButtonElement {
    dispose() { disposed++; this.remove() }
  }
  const button = new Ready(document)
  button.addEventListener("click", () => clicks++)
  const group = new DOMGroup(document, button)
  observeConnection(group, {connected() { connected++ }, disconnected() { disconnected++ }})
  const left = contentProgram.mount(first, {value: group})
  expect(left.rootNodes).toEqual([button])
  expect(group.insertionNodes.every(node => node.parentNode === first)).toBe(true)
  button.focus()
  const right = contentProgram.mount(second, {value: group})
  expect(document.activeElement === button).toBe(true)
  expect(connected).toBe(1)
  expect(disconnected).toBe(0)
  left.update({value: null})
  left.dispose()
  expect(group.parentNode).toBe(second)
  expect(button.parentNode).toBe(second)
  button.dispatchEvent(new Event("click"))
  expect(clicks).toBe(1)
  right.dispose()
  expect(group.parentNode).toBeNull()
  expect(group.nodes).toEqual([button])
  expect(disposed).toBe(0)
  expect(disconnected).toBe(1)
  const direct = contentProgram.mount(first, {value: button})
  direct.dispose()
  expect(disposed).toBe(0)
})

test("construction creates the actual class, reuses constructor/key and passes props/content/context directly", () => {
  const {document, first} = fixture()
  let created = 0, disposed = 0, connected = 0, disconnected = 0
  class Ready extends HTMLDivElement {
    static readonly [domComponentConstructorBrand] = true as const
    props: {label: string}
    content: DOMComponentContent
    context: unknown
    private readonly scope
    constructor(document: Document, props: {label: string}, content: DOMComponentContent = {}, context?: unknown) {
      super(document)
      created++
      this.props = props
      this.content = content
      this.context = context
      this.textContent = props.label
      this.scope = observeConnection(this, {connected() { connected++ }, disconnected() { disconnected++ }})
    }
    update(props: {label: string}, content: DOMComponentContent = {}, context?: unknown) {
      if (props.label === "reject") throw new Error("update rejected")
      this.props = props
      this.content = content
      this.context = context
      this.textContent = props.label
    }
    dispose() { disposed++; this.scope.dispose(); this.remove() }
  }
  const raw = document.createElement("span")
  const instance = contentProgram.mount(first, {value: {type: Ready, props: {label: "one"}, key: "stable", content: {header: raw}, context: "A"}})
  const ready = first.querySelector("div") as Ready
  expect(ready).toBeInstanceOf(Ready)
  expect(ready.content).toEqual({header: raw})
  expect(ready.context).toBe("A")
  instance.update({value: {type: Ready, props: {label: "two"}, key: "stable", context: "B"}})
  expect(first.querySelector("div")).toBe(ready)
  expect(ready.context).toBe("B")
  expect(created).toBe(1)
  expect(connected).toBe(1)
  expect(() => instance.update({value: {type: Ready, props: {label: "reject"}, key: "stable"}})).toThrow("update rejected")
  expect(ready.textContent).toBe("two")
  instance.update({value: {type: Ready, props: {label: "three"}, key: "different"}})
  expect(first.querySelector("div")).not.toBe(ready)
  expect(created).toBe(2)
  expect(disposed).toBe(1)
  instance.dispose()
  expect(disposed).toBe(2)
  expect(disconnected).toBe(2)
})

test("owned fragment constructors stay hostless and transfer to another raw receiver without old cleanup", () => {
  const {document, first, second} = fixture()
  let disposed = 0
  class Pair extends DOMGroup {
    static readonly [domComponentConstructorBrand] = true as const
    props: {label: string}
    content = {}
    constructor(document: Document, props: {label: string}) { super(document, document.createElement("button"), props.label); this.props = props }
    update(props: {label: string}) { this.props = props; this.nodes[1]!.textContent = props.label }
    dispose() { disposed++; this.remove() }
  }
  const left = contentProgram.mount(first, {value: {type: Pair, props: {label: "one"}}})
  const button = first.querySelector("button")!
  expect(first.children).toEqual([button])
  left.update({value: {type: Pair, props: {label: "two"}}})
  expect(first.querySelector("button")).toBe(button)
  expect(first.textContent).toBe("two")
  // Получатель может сохранить actual group через собственный constructor.
  let pair: Pair | undefined
  class Captured extends Pair { constructor(document: Document, props: {label: string}) { super(document, props); pair = this } }
  left.update({value: {type: Captured, props: {label: "captured"}}})
  expect(disposed).toBe(1)
  const right = contentProgram.mount(second, {value: pair})
  left.dispose()
  expect(disposed).toBe(1)
  expect(pair!.parentNode).toBe(second)
  right.dispose()
  expect(disposed).toBe(1)
  expect(pair!.nodes).toHaveLength(2)
  pair!.dispose()
  expect(disposed).toBe(2)
})

test("native range replacement rejects invalid spatial construction and restores raw Group origins/focus before observers", () => {
  const document = createDocument(), space = document.createElement("space")
  document.append(space)
  const button = document.createElement("button"), raw = new DOMGroup(document, button)
  let oldDisposed = 0, rejectedDisposed = 0
  class Ready extends DisplayElement {
    static readonly [domComponentConstructorBrand] = true as const
    props = {}
    content: DOMComponentContent
    constructor(document: Document, props: {}, content: DOMComponentContent) { super(document); this.content = content; this.append(raw) }
    update() {}
    dispose() { oldDisposed++; this.remove() }
  }
  class Invalid extends HTMLDivElement {
    static readonly [domComponentConstructorBrand] = true as const
    props = {}
    content: DOMComponentContent
    constructor(document: Document, props: {}, content: DOMComponentContent) { super(document); this.content = content; this.append(raw) }
    update() {}
    dispose() { rejectedDisposed++; if (raw.parentNode === this) raw.remove(); this.remove() }
  }
  const instance = contentProgram.mount(space, {value: {type: Ready, props: {}, content: {"": raw}}})
  const ready = space.querySelector("display")!
  button.focus()
  const snapshots: unknown[] = []
  document.subscribeMutations(() => snapshots.push([raw.parentNode === ready, document.activeElement === button]))
  expect(() => instance.update({value: {type: Invalid, props: {}, content: {"": raw}}})).toThrow("Space accepts only spatial elements")
  expect(space.querySelector("display")).toBe(ready)
  expect(raw.parentNode).toBe(ready)
  expect(raw.nodes).toEqual([button])
  expect(document.activeElement === button).toBe(true)
  expect(oldDisposed).toBe(0)
  expect(rejectedDisposed).toBe(1)
  expect(snapshots.length).toBeGreaterThan(0)
  expect(snapshots.every(snapshot => JSON.stringify(snapshot) === "[true,true]")).toBe(true)
  instance.dispose()
  expect(oldDisposed).toBe(1)
})

test("array cleanup completes every owned generated object even when dispose throws undefined", () => {
  const {first} = fixture()
  const disposed: number[] = []
  class Item extends HTMLDivElement {
    static readonly [domComponentConstructorBrand] = true as const
    content = {}
    constructor(document: Document, readonly props: {id: number}) { super(document) }
    update() {}
    dispose() { disposed.push(this.props.id); this.remove(); if (this.props.id === 1) throw undefined }
  }
  const instance = contentProgram.mount(first, {value: [{type: Item, props: {id: 1}}, {type: Item, props: {id: 2}}]})
  let thrown = false
  try { instance.dispose() } catch { thrown = true }
  expect(thrown).toBe(true)
  expect(disposed).toEqual([1, 2])
  expect(first.childNodes).toEqual([])
  instance.dispose()
  expect(disposed).toEqual([1, 2])
})

test("static HTML is constructs native CE before props binding; dynamic is stays an ordinary attribute", () => {
  const {document, first} = fixture()
  class Counter extends HTMLButtonElement {
    set props(value: {count: number}) { this.textContent = String(value.count) }
  }
  document.customElementRegistry.define("x-counter", Counter, {extends: "button"})
  const instance = compile((props: {count: number}) => html`<button is="x-counter" .props=${props}></button><button is=${"x-counter"}></button>`).mount(first, {count: 3})
  expect(first.children[0]).toBeInstanceOf(Counter)
  expect(first.children[0]!.textContent).toBe("3")
  expect(first.children[1]).not.toBeInstanceOf(Counter)
  instance.update({count: 4})
  expect(first.children[0]!.textContent).toBe("4")
  instance.dispose()
})

test("failed HTML mount restores earlier raw assignments and cleans newly owned constructions", () => {
  const {document, first, second} = fixture()
  const raw = new DOMGroup(document, document.createElement("button"))
  second.append(raw)
  const button = raw.nodes[0] as HTMLButtonElement
  button.focus()
  const cyclic: unknown[] = []
  cyclic.push(cyclic)
  expect(() => compile(() => html`${raw}${cyclic}`).mount(first, {})).toThrow("cannot contain themselves")
  expect(first.childNodes).toEqual([])
  expect(raw.parentNode).toBe(second)
  expect(raw.nodes).toEqual([button])
  expect(document.activeElement === button).toBe(true)
})

test("construction can retain its former generated root as caller-owned raw content without disposing it", () => {
  const {document, first} = fixture()
  let disposed = 0
  class Ready extends HTMLDivElement {
    static readonly [domComponentConstructorBrand] = true as const
    props = {}
    content = {}
    constructor(document: Document) { super(document) }
    update() {}
    dispose() { disposed++; this.remove() }
  }
  const instance = contentProgram.mount(first, {value: {type: Ready, props: {}}})
  const ready = first.querySelector("div")!
  instance.update({value: ready})
  expect(disposed).toBe(0)
  expect(first.querySelector("div")).toBe(ready)
  instance.dispose()
  expect(disposed).toBe(0)
})

test("nested HTML ownership is captured before replacement and disposes generated descendants exactly once", () => {
  const {first} = fixture()
  let disposed = 0
  class Ready extends HTMLDivElement {
    static readonly [domComponentConstructorBrand] = true as const
    props = {}
    content = {}
    constructor(document: Document) { super(document) }
    update() {}
    dispose() { disposed++; this.remove() }
  }
  const nested = () => html`${{type: Ready, props: {}}}`
  const instance = contentProgram.mount(first, {value: nested()})
  expect(first.children).toHaveLength(1)
  instance.update({value: first.ownerDocument!.createElement("span")})
  expect(disposed).toBe(1)
  instance.update({value: nested()})
  instance.dispose()
  expect(disposed).toBe(2)
})
