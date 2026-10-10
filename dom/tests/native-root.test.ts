import {expect, test} from "bun:test"
import {createDocument, createDomRoot, domComponentConstructorBrand, DOMGroup, Event, HTMLDivElement, Node, observeConnection, type Document, type DOMComponentContent} from "../src/index.ts"
import {DisplayElement} from "../display/index.ts"

type Props = {label: string}
class Surface extends DisplayElement {
  static [domComponentConstructorBrand] = true as const
  props: Readonly<Props>
  content: DOMComponentContent
  constructor(document: Document, props: Readonly<Props>, content: DOMComponentContent = {}) {
    super(document)
    this.props = props
    this.content = content
    if (content[""] instanceof Node) this.append(content[""])
    this.update(props)
  }
  update(props: Readonly<Props>) {
    this.props = props
    this.setAttribute("title", props.label)
  }
  dispose() { this.remove() }
}
class InvalidSurface extends HTMLDivElement {
  static [domComponentConstructorBrand] = true as const
  props: Readonly<Props>
  content: DOMComponentContent
  constructor(document: Document, props: Readonly<Props>, content: DOMComponentContent = {}) {
    super(document)
    this.props = props
    this.content = content
    if (content[""] instanceof Node) this.append(content[""])
  }
  update(props: Readonly<Props>) { this.props = props }
  dispose() { this.remove() }
}

test("reused root update с новыми connection scopes сохраняет внешний batch", () => {
  const document = createDocument(), container = document.createElement("div")
  document.append(container)
  let connected = 0
  const scopes: ReturnType<typeof observeConnection>[] = []
  class Growing extends InvalidSurface {
    override update(props: Readonly<Props>) {
      this.props = props
      const child = this.ownerDocument!.createElement("button")
      scopes.push(observeConnection(child, {connected() { connected++ }}))
      this.append(child)
    }
    override dispose() {
      for (const scope of scopes) scope.dispose()
      this.remove()
    }
  }
  const root = createDomRoot(container)
  root.render(Growing, {label: "initial"})
  document.transaction(() => {
    root.render(Growing, {label: "replace descendants"})
    root.flush()
    expect(connected).toBe(0)
  })
  expect(connected).toBe(1)
  expect(container.querySelectorAll("button")).toHaveLength(1)
  root.unmount()
})

test("DOM root возвращает raw content и фокус при отклонении нового корня", () => {
  const document = createDocument()
  const space = document.createElement("space")
  const raw = document.createElement("button")
  document.append(space)
  const root = createDomRoot(space)
  root.render(Surface, {label: "old"}, {content: {"": raw}})
  const old = space.firstChild
  raw.focus()
  const observed: boolean[] = []
  const unsubscribe = document.subscribeMutations(() => {
    observed.push(space.firstChild === old && raw.parentNode === old && document.activeElement === raw)
  })
  expect(() => root.render(InvalidSurface, {label: "bad"}, {content: {"": raw}})).toThrow("Space accepts")
  expect(space.firstChild === old).toBeTrue()
  expect(raw.parentNode === old).toBeTrue()
  expect(document.activeElement === raw).toBeTrue()
  expect(observed.length > 0 && observed.every(Boolean)).toBeTrue()
  unsubscribe()
  root.render(Surface, {label: "accepted"})
  expect(space.firstChild === old).toBeTrue()
  expect((old as Surface).getAttribute("title")).toBe("accepted")
  root.unmount()
  expect(space.childNodes).toHaveLength(0)
})

test("DOM root обновляет и освобождает тот же узел после переноса из Fragment", () => {
  const document = createDocument()
  const staging = document.createDocumentFragment()
  const space = document.createElement("space")
  document.append(space)
  const root = createDomRoot(staging)
  root.render(Surface, {label: "staged"})
  const element = staging.querySelector("display")!
  space.append(element)
  root.render(Surface, {label: "moved"})
  expect(space.firstChild === element).toBeTrue()
  expect(element.getAttribute("title")).toBe("moved")
  root.unmount()
  expect(element.parentNode).toBeNull()
  expect(space.childNodes).toHaveLength(0)
})

test("DOM root допускает одного живого владельца каждого корректного контейнера", () => {
  const document = createDocument()
  const element = document.createElement("main")
  const fragment = document.createDocumentFragment()
  for (const container of [document, element, fragment]) {
    const root = createDomRoot(container)
    expect(() => createDomRoot(container)).toThrow("live DOM root")
    root.render(null)
    expect(() => createDomRoot(container)).toThrow("live DOM root")
    root.unmount()
    const replacement = createDomRoot(container)
    root.unmount()
    expect(() => createDomRoot(container)).toThrow("live DOM root")
    replacement.unmount()
  }
  const left = createDomRoot(element), right = createDomRoot(fragment)
  left.render(InvalidSurface, {label: "left"})
  right.render(InvalidSurface, {label: "right"})
  expect(element.firstChild === fragment.firstChild).toBeFalse()
  left.unmount()
  expect(fragment.childNodes).toHaveLength(1)
  right.unmount()
})

test("DOM root освобождает владение при ошибке cleanup и не оживляет прежний root", () => {
  const document = createDocument(), container = document.createElement("main")
  class ThrowingSurface extends InvalidSurface {
    override dispose() {
      this.remove()
      throw new Error("cleanup failed")
    }
  }
  const root = createDomRoot(container)
  root.render(ThrowingSurface, {label: "old"})
  expect(() => root.unmount()).toThrow("cleanup failed")
  expect(container.childNodes).toHaveLength(0)
  const replacement = createDomRoot(container)
  expect(() => root.render(InvalidSurface, {label: "stale"})).toThrow("unmounted")
  root.unmount()
  expect(() => createDomRoot(container)).toThrow("live DOM root")
  replacement.unmount()
})

test("DOM root отвергает неподдержанные значения до захвата контейнера", () => {
  const document = createDocument(), fragment = document.createDocumentFragment()
  for (const invalid of [null, undefined, {}, document.createTextNode("text"), document.createComment("comment"), new DOMGroup(document)]) {
    expect(() => createDomRoot(invalid as never)).toThrow("Document, Element or DocumentFragment")
  }
  const root = createDomRoot(fragment)
  root.unmount()
})

test("перенос всего staging Fragment сохраняет stateful multi-root и slot диапазоны", () => {
  const document = createDocument(), staging = document.createDocumentFragment()
  const host = document.createElement("main"), left = document.createElement("div"), right = document.createElement("div")
  host.append(left, right)
  document.append(host)
  const input = document.createElement("input")
  const slot = new DOMGroup(document, input)
  let mounts = 0, cleanups = 0
  class CounterRange extends DOMGroup {
    static [domComponentConstructorBrand] = true as const
    props: Readonly<Props>
    content: DOMComponentContent
    readonly button = document.createElement("button")
    readonly status = document.createElement("span")
    private count = 0
    private readonly scope
    constructor(owner: Document, props: Readonly<Props>, content: DOMComponentContent = {}) {
      super(owner)
      this.props = props
      this.content = content
      this.append(this.button, this.status, content[""] as DOMGroup)
      this.button.addEventListener("click", () => {
        this.count++
        document.enqueueTask(() => { this.status.textContent = `${this.props.label}:${this.count}` })
      })
      this.scope = observeConnection(this, {connected() { mounts++ }, disconnected() { cleanups++ }})
      this.update(props)
    }
    update(props: Readonly<Props>) {
      this.props = props
      this.status.textContent = `${props.label}:${this.count}`
    }
    dispose() {
      this.scope.dispose()
      this.remove()
    }
  }
  const root = createDomRoot(staging)
  root.render(CounterRange, {label: "first"}, {content: {"": slot}})
  const original = [...staging.childNodes]
  const button = staging.querySelector("button")!
  expect(root.current instanceof CounterRange).toBeTrue()
  const instance = root.current
  left.append(staging)
  input.focus()
  button.dispatchEvent(new Event("click"))
  expect(left.querySelector("span")?.textContent).toBe("first:1")
  const outside = document.createElement("aside")
  right.append(outside)
  root.moveTo(right, outside)
  root.render(CounterRange, {label: "updated"}, {content: {"": slot}})
  expect(root.current === instance).toBeTrue()
  expect(right.childNodes).toEqual([...original, outside])
  expect(right.querySelector("span")?.textContent).toBe("updated:1")
  expect(document.activeElement === input).toBeTrue()
  expect(slot.parentNode === right).toBeTrue()
  expect([mounts, cleanups]).toEqual([1, 0])
  root.moveTo(left)
  expect(left.childNodes).toEqual(original)
  expect(document.activeElement === input).toBeTrue()
  expect(() => root.moveTo(document.createElement("space"))).toThrow("Space accepts")
  expect(left.childNodes).toEqual(original)
  right.insertBefore(root.current!, outside)
  class ReplacementRange extends CounterRange {}
  root.render(ReplacementRange, {label: "replacement"}, {content: {"": slot}})
  expect(root.current instanceof ReplacementRange).toBeTrue()
  expect(staging.childNodes).toHaveLength(0)
  expect(right.querySelector("span")?.textContent).toBe("replacement:0")
  expect(right.querySelector("button") === button).toBeFalse()
  expect(slot.parentNode === right).toBeTrue()
  expect(document.activeElement === input).toBeTrue()
  expect([mounts, cleanups]).toEqual([2, 1])
  root.unmount()
  expect(root.current).toBeNull()
  expect(left.childNodes).toHaveLength(0)
  expect(right.childNodes).toEqual([outside])
  expect(cleanups).toBe(2)
})

test("DOM root сохраняет bounded placement при пустом render и отклоняет неверный перенос", () => {
  const document = createDocument(), staging = document.createDocumentFragment()
  const target = document.createElement("main"), before = document.createElement("span")
  target.append(before)
  document.append(target)
  const root = createDomRoot(staging)
  root.moveTo(target, before)
  root.render(InvalidSurface, {label: "first"})
  const first = target.firstChild
  expect(() => root.moveTo(createDocument().createDocumentFragment())).toThrow("same Document")
  expect(() => root.moveTo(target, document.createComment("foreign reference"))).toThrow("reference")
  expect(target.childNodes).toEqual([first!, before])
  root.render(null)
  expect(target.childNodes).toEqual([before])
  root.render(InvalidSurface, {label: "second"})
  expect(target.childNodes).toHaveLength(2)
  expect(target.lastChild === before).toBeTrue()
  root.unmount()
  expect(target.childNodes).toEqual([before])
  expect(() => root.moveTo(staging)).toThrow("unmounted")
})


test("замена корня Document соблюдает ограничение одного Element и сохраняет соседние комментарии", () => {
  const document = createDocument()
  class Region extends DOMGroup {
    static readonly [domComponentConstructorBrand] = true as const
    props: Readonly<Props>
    content: DOMComponentContent = {}
    constructor(owner: Document, props: Readonly<Props>) {
      super(owner, owner.createElement("main"))
      this.props = props
    }
    update(props: Readonly<Props>) { this.props = props }
    dispose() { this.remove() }
  }
  class InvalidRegion extends Region {
    constructor(owner: Document, props: Readonly<Props>) {
      super(owner, props)
      this.append(owner.createElement("aside"))
    }
  }
  const root = createDomRoot(document)
  root.render(InvalidSurface, {label: "element"})
  const leading = document.createComment("before")
  const trailing = document.createComment("after")
  document.prepend(leading)
  document.append(trailing)
  root.render(InvalidSurface, {label: "another"}, {key: "new"})
  expect(document.documentElement === root.current).toBeTrue()
  root.render(Region, {label: "range"})
  const group = root.current as Region
  expect(group.parentNode).toBe(document)
  expect(document.documentElement?.localName).toBe("main")
  expect(() => root.render(InvalidRegion, {label: "invalid"})).toThrow()
  expect(root.current === group).toBeTrue()
  expect(document.documentElement?.localName).toBe("main")
  root.render(InvalidSurface, {label: "element again"})
  expect(document.documentElement === root.current).toBeTrue()
  expect(document.firstChild === leading).toBeTrue()
  expect(document.lastChild === trailing).toBeTrue()
  root.unmount()
  expect(document.childNodes).toEqual([leading, trailing])
})
