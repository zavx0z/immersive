import {expect, test} from "bun:test"
import {createDocument, DOMGroup, Element, Event, HTMLButtonElement, HTMLInputElement, observeConnection, defineDOMPropertyAttributes, notifyDOMPropertyChange, nativePropertyForBinding, propertyOperation, prepareDomOperation, type Document} from "../src/index.ts"

for (const registered of [false, true]) {
  test(`native title/disabled отражаются в derived DOM (${registered ? "registry" : "direct"})`, () => {
    const document = createDocument(), host = document.createElement("main")
    document.append(host)
    let changes = 0, renders = 0
    class Button extends HTMLButtonElement {
      readonly scope
      private readonly render = () => {
        renders++
        this.scope.suppressChanges(() => { this.textContent = `${this.title}:${this.disabled}` })
      }
      constructor(owner: Document) {
        super(owner)
        this.scope = observeConnection(this, {attributes: ["TITLE", "disabled"], changed: () => {
          changes++
          this.ownerDocument!.enqueueTask(this.render)
        }})
      }
    }
    if (registered) document.customElementRegistry.define("x-watched-button", Button, {extends: "button"})
    const button = registered ? document.createElement("button", {is: "x-watched-button"}) as Button : new Button(document)
    host.append(button)
    button.title = "first"
    expect(button.textContent).toBe("first:false")
    document.transaction(() => {
      button.setAttribute("title", "next")
      button.disabled = true
      button.setAttribute("data-unrelated", "ignored")
      expect(button.textContent).toBe("first:false")
    })
    expect(button.textContent).toBe("next:true")
    expect([changes, renders]).toEqual([2, 2])
    button.setAttribute("title", "next")
    expect(changes).toBe(2)
    button.remove()
    button.title = "detached"
    expect(button.textContent).toBe("detached:true")
    button.scope.dispose()
    button.title = "after disposal"
    document.flushTasks()
    expect(button.textContent).toBe("detached:true")
  })

  test(`dirty input value/checked наблюдаются без value attributes (${registered ? "registry" : "direct"})`, () => {
    const document = createDocument(), host = document.createElement("main")
    document.append(host)
    let derived = "", changes = 0
    class Input extends HTMLInputElement {
      readonly scope
      constructor(owner: Document) {
        super(owner)
        this.scope = observeConnection(this, {properties: ["value", "checked"], changed: () => {
          changes++
          derived = `${this.value}:${this.checked}`
        }})
      }
    }
    if (registered) document.customElementRegistry.define("x-watched-input", Input, {extends: "input"})
    const input = registered ? document.createElement("input", {is: "x-watched-input"}) as Input : new Input(document)
    host.append(input)
    document.transaction(() => {
      input.value = "dirty"
      input.checked = true
      input.value = "accepted"
    })
    expect(derived).toBe("accepted:true")
    expect(changes).toBe(1)
    expect(input.getAttribute("value")).toBeNull()
    input.remove()
    input.value = "detached"
    expect(derived).toBe("detached:true")
    const count = changes
    input.value = "detached"
    expect(changes).toBe(count)
    input.scope.dispose()
  })
}

test("suppression вложен, исключает только свои записи и не теряет pending внешнее изменение", () => {
  const document = createDocument(), button = document.createElement("button")
  let own = 0, other = 0
  const scope = observeConnection(button, {attributes: ["title"], changed: () => { own++ }})
  const second = observeConnection(button, {attributes: ["title"], changed: () => { other++ }})
  document.transaction(() => {
    button.title = "external"
    scope.suppressChanges(() => {
      scope.suppressChanges(() => { button.title = "own" })
    })
  })
  expect([own, other]).toEqual([1, 1])
  expect(() => scope.suppressChanges(() => {
    button.title = "own throw"
    throw new Error("writing failed")
  })).toThrow("writing failed")
  expect([own, other]).toEqual([1, 2])
  button.title = "after throw"
  expect([own, other]).toEqual([2, 3])
  scope.dispose()
  second.dispose()
})

test("native CE callback порядок сохраняется; observer callbacks используют один commit до tasks", () => {
  const document = createDocument(), order: string[] = []
  class Button extends HTMLButtonElement {
    static observedAttributes = ["title"]
    attributeChangedCallback() { order.push("native") }
  }
  document.customElementRegistry.define("x-native-order", Button, {extends: "button"})
  const button = document.createElement("button", {is: "x-native-order"})
  observeConnection(button, {attributes: ["title"], changed() { order.push("changed") }})
  button.addEventListener("change", () => {
    button.title = "first"
    order.push("after setter")
    document.enqueueTask(() => { order.push("task") })
  })
  button.dispatchEvent(new Event("change"))
  expect(order).toEqual(["native", "after setter", "changed", "task"])
})

test("точные native изменения следуют adoption и cleanup не доставляет pending callback", () => {
  const first = createDocument(), next = createDocument()
  const host = first.createElement("main"), destination = next.createElement("main")
  first.append(host)
  next.append(destination)
  const input = first.createElement("input"), order: string[] = []
  const scope = observeConnection(input, {properties: ["value"], connected() { order.push("connected") },
    disconnected() { order.push("disconnected") }, adopted(previous, document) {
      expect(previous).toBe(first)
      expect(document).toBe(next)
      order.push("adopted")
    }, changed() {
      order.push(`changed:${input.ownerDocument === next ? "next" : "first"}:${input.value}`)
    }})
  host.append(input)
  next.transaction(() => {
    destination.append(input)
    input.value = "adopted value"
  })
  expect(order).toEqual(["connected", "disconnected", "adopted", "connected", "changed:next:adopted value"])
  next.transaction(() => {
    input.value = "discarded notification"
    scope.dispose()
  })
  expect(order.at(-1)).toBe("disconnected")
  expect(order.filter(value => value.startsWith("changed:"))).toHaveLength(1)
})

test("фильтры не обходят потомков, validation не создаёт частичное наблюдение", () => {
  const document = createDocument(), parent = document.createElement("div")
  let changes = 0
  for (let index = 0; index < 100; index++) {
    const child = document.createElement("button")
    parent.append(child)
    observeConnection(child, {attributes: ["title"], changed: () => { changes++ }})
  }
  parent.title = "parent"
  document.flushTasks()
  expect(changes).toBe(0)
  parent.firstElementChild!.setAttribute("title", "only one")
  expect(changes).toBe(1)
  expect(() => observeConnection(parent, {attributes: ["title"]})).toThrow("changed callback")
  expect(() => observeConnection(new DOMGroup(document), {attributes: ["title"], changed() {}})).toThrow("Node target")
  expect(() => observeConnection(parent, {properties: [""], changed() {}})).toThrow("nonempty names")
})

test("numeric и selection projections используют actual property names у input/textarea", () => {
  const document = createDocument(), input = document.createElement("input"), area = document.createElement("textarea")
  input.type = "number"
  let number = NaN, selection = "", numberChanges = 0, selectionChanges = 0
  const numberScope = observeConnection(input, {properties: ["valueAsNumber"], changed() {
    numberChanges++
    number = input.valueAsNumber
  }})
  input.valueAsNumber = 12
  expect(number).toBe(12)
  input.setAttribute("value", "99")
  expect(number).toBe(12)
  const selectionScope = observeConnection(area, {properties: ["selectionStart", "selectionEnd", "selectionDirection"], changed() {
    selectionChanges++
    selection = `${area.selectionStart}:${area.selectionEnd}:${area.selectionDirection}`
  }})
  area.value = "abcdef"
  selectionChanges = 0
  document.transaction(() => {
    area.selectionStart = 1
    area.selectionEnd = 4
    area.selectionDirection = "backward"
  })
  expect(selection).toBe("1:4:backward")
  expect(selectionChanges).toBe(1)
  expect(numberChanges).toBe(2)
  numberScope.dispose()
  selectionScope.dispose()
})

test("select value/selectedIndex следуют direct setters, option selectedness и изменению DOM options", () => {
  const document = createDocument(), select = document.createElement("select")
  const a = document.createElement("option"), b = document.createElement("option")
  a.value = "a"
  b.value = "b"
  select.append(a, b)
  let derived = "", changes = 0
  const scope = observeConnection(select, {properties: ["value", "selectedIndex"], changed() {
    changes++
    derived = `${select.value}:${select.selectedIndex}`
  }})
  select.value = "b"
  expect(derived).toBe("b:1")
  const before = changes
  select.selectedIndex = 0
  expect(derived).toBe("a:0")
  expect(changes).toBe(before + 1)
  b.selected = true
  expect(derived).toBe("b:1")
  b.value = "changed"
  expect(derived).toBe("changed:1")
  b.remove()
  expect(derived).toBe("a:0")
  scope.dispose()
})

test("reflected exceptions, scroll, media и spatial native поля остаются у самого DOM owner", () => {
  const document = createDocument(), label = document.createElement("label"), input = document.createElement("input")
  const video = document.createElement("video"), viewpoint = document.createElement("viewpoint")
  const root = document.createElement("div")
  const values: unknown[] = []
  const scopes = [
    observeConnection(label, {properties: ["htmlFor", "className"], changed() { values[0] = `${label.htmlFor}:${label.className}` }}),
    observeConnection(input, {properties: ["defaultValue", "defaultChecked"], changed() { values[1] = `${input.defaultValue}:${input.defaultChecked}` }}),
    observeConnection(root, {properties: ["scrollLeft", "scrollTop"], changed() { values[2] = `${root.scrollLeft}:${root.scrollTop}` }}),
    observeConnection(video, {properties: ["srcObject", "muted", "currentTime"], changed() { values[3] = [video.srcObject, video.muted, video.currentTime] }}),
    observeConnection(viewpoint, {properties: ["targetX", "flySpeed"], changed() { values[4] = `${viewpoint.targetX}:${viewpoint.flySpeed}` }}),
  ]
  const media = {}
  document.transaction(() => {
    label.htmlFor = "field"
    label.className = "control"
    input.defaultValue = "default"
    input.defaultChecked = true
    root.scrollLeft = 17
    root.scrollTop = 23
    video.srcObject = media
    video.muted = true
    video.currentTime = 4
    viewpoint.targetX = 42
    viewpoint.flySpeed = 7
  })
  expect(values).toEqual(["field:control", "default:true", "17:23", [media, true, 4], "42:7"])
  for (const scope of scopes) scope.dispose()
})

test("textContent/innerHTML и textarea defaults видят реальные дочерние изменения без второго дерева", () => {
  const document = createDocument(), root = document.createElement("div"), area = document.createElement("textarea")
  let text = "", html = "", defaults = ""
  const first = observeConnection(root, {properties: ["textContent", "innerHTML"], changed() {
    text = root.textContent
    html = root.innerHTML
  }})
  const second = observeConnection(area, {properties: ["defaultValue", "value"], changed() { defaults = `${area.defaultValue}:${area.value}` }})
  root.innerHTML = "<span>first</span>"
  const span = root.firstElementChild!
  span.firstChild!.textContent = "next"
  expect(text).toBe("next")
  expect(html).toBe("<span>next</span>")
  span.setAttribute("title", "native")
  expect(html).toBe('<span title="native">next</span>')
  area.defaultValue = "initial"
  expect(defaults).toBe("initial:initial")
  area.value = "dirty"
  area.defaultValue = "changed"
  expect(defaults).toBe("changed:dirty")
  first.dispose()
  second.dispose()
})

test("native alias proof совпадает с реальным binding transport, setter сам по себе не является доказательством", () => {
  const document = createDocument(), input = document.createElement("input"), label = document.createElement("label")
  expect(nativePropertyForBinding(input, "value")).toBe("value")
  expect(nativePropertyForBinding(input, "title")).toBe("title")
  expect(nativePropertyForBinding(input, "disabled")).toBe("disabled")
  expect(nativePropertyForBinding(input, "valueAsNumber")).toBeNull()
  expect(nativePropertyForBinding(label, "htmlFor")).toBeNull()
  expect(nativePropertyForBinding(input, "defaultValue")).toBeNull()
  expect(nativePropertyForBinding(input, "textContent")).toBeNull()
  class PrivateTitle extends HTMLButtonElement {
    private caption = "private"
    override get title() { return this.caption }
    override set title(value: string) { this.caption = value }
  }
  expect(nativePropertyForBinding(new PrivateTitle(document), "title")).toBeNull()
  const patch = prepareDomOperation(propertyOperation(input, "disabled", true))!
  patch.apply()
  expect(input.disabled).toBeTrue()
  patch.rollback()
  expect(input.disabled).toBeFalse()
  const title = prepareDomOperation(propertyOperation(input, "title", undefined))
  expect(title).toBeNull()
})

test("ошибка changed не пропускает другие scopes, feedback ограничен общей Document queue", () => {
  const document = createDocument(), button = document.createElement("button")
  let received = 0
  const bad = observeConnection(button, {properties: ["title"], changed() { throw new Error("observer failed") }})
  const good = observeConnection(button, {properties: ["title"], changed() { received++ }})
  expect(() => { button.title = "accepted" }).toThrow("observer failed")
  expect(received).toBe(1)
  bad.dispose()
  good.dispose()
  let looping = true, changes = 0
  const loop = observeConnection(button, {properties: ["title"], changed() {
    changes++
    if (looping) button.title = String(changes)
  }})
  try {
    expect(() => { button.title = "start" }).toThrow("did not settle")
    expect(changes).toBeLessThan(210)
    looping = false
    button.title = "retry"
    expect(button.title).toBe("retry")
  } finally {
    looping = false
    loop.dispose()
  }
})

test("extension владеет metadata и неатрибутным состоянием; наследование использует один lifecycle index", () => {
  const document = createDocument()
  class Extension extends Element {
    private resource: object | null = null
    constructor(owner: Document) { super(owner, "native-extension") }
    get distance() { return Number(this.getAttribute("native-distance") ?? 0) }
    set distance(value: number) { this.setAttribute("native-distance", String(value)) }
    get handle() { return this.resource }
    set handle(value: object | null) {
      if (this.resource === value) return
      this.ownerDocument!.transaction(() => {
        this.resource = value
        notifyDOMPropertyChange(this, "handle")
      })
    }
  }
  const attributes = ["native-distance"]
  defineDOMPropertyAttributes(Extension, {distance: attributes})
  attributes[0] = "unrelated"
  class Specialized extends Extension {}
  const element = new Specialized(document), handle = {}
  let changes = 0, values: unknown[] = []
  const scope = observeConnection(element, {properties: ["distance", "handle"], changed() {
    changes++
    values = [element.distance, element.handle]
  }})
  document.transaction(() => {
    element.distance = 42
    element.handle = handle
  })
  expect(values).toEqual([42, handle])
  expect(changes).toBe(1)
  element.setAttribute("unrelated", "ignored")
  expect(changes).toBe(1)
  expect(() => defineDOMPropertyAttributes(Extension, {distance: "other"})).toThrow("already declared")
  expect(() => notifyDOMPropertyChange(element, "")).toThrow("nonempty name")
  scope.dispose()
})
