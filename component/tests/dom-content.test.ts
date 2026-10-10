import {expect, test} from "bun:test"
import {createDocument, createDomRoot as createRoot, Element, Event, parseFragment} from "@zavx0z/immersive-dom"
import {html, compile} from "@zavx0z/immersive-template"
import {components} from "./fixture.ts"

const Pane = components.StatefulPane

test("готовый Pane принимает default Node и именованный Fragment в том же Document", () => {
  const document = createDocument()
  const host = document.createElement("div")
  const destination = document.createElement("aside")
  const shell = document.createElement("div")
  document.append(shell)
  shell.append(host, destination)
  const lifecycle = {mounts: 0, cleanups: 0}
  const button = document.createElement("button")
  button.textContent = "Содержимое"
  button.setAttribute("data-origin", "author")
  let clicks = 0
  button.addEventListener("click", () => { clicks++ })
  const fragment = document.createDocumentFragment()
  const heading = document.createElement("b")
  heading.textContent = "Заголовок"
  fragment.append(heading, document.createTextNode("!"))
  const content = {"": button, header: fragment}
  const root = createRoot(host)
  try {
    root.render(Pane, {title: "Первый", lifecycle}, {content})
    expect(fragment.childNodes).toHaveLength(0)
    expect(host.querySelector("button")).toBe(button)
    expect(host.querySelector("header b")).toBe(heading)
    expect(host.querySelector("header")!.textContent).toBe("Заголовок!")
    expect(button.ownerDocument).toBe(document)
    button.dispatchEvent(new Event("click", {bubbles: true}))
    expect(clicks).toBe(1)
    root.render(Pane, {title: "Второй", lifecycle}, {content})
    expect(host.querySelector("h2")!.textContent).toBe("Второй:1")
    expect(host.querySelector("button")).toBe(button)
    expect(host.querySelector("header b")).toBe(heading)
    destination.append(host)
    expect(button.getAttribute("data-origin")).toBe("author")
    expect(lifecycle).toEqual({mounts: 1, cleanups: 0})
    root.unmount()
    expect(button.parentNode).toBeNull()
    expect(heading.parentNode).toBeNull()
    button.dispatchEvent(new Event("click"))
    expect(clicks).toBe(2)
    expect(lifecycle.cleanups).toBe(1)
  } finally { root.unmount() }
})

test("тот же custom constructor сохраняет content, DOM и state после reconnect", () => {
  const document = createDocument()
  const parent = document.createElement("div")
  const destination = document.createElement("aside")
  const shell = document.createElement("div")
  document.append(shell)
  shell.append(parent, destination)
  const lifecycle = {mounts: 0, cleanups: 0}
  document.customElementRegistry.define("ready-pane", Pane, {extends: "div"})
  const custom = document.createElement("div", {is: "ready-pane"}) as any
  const body = document.createElement("input")
  body.value = "Пользовательское значение"
  const fragment = document.createDocumentFragment()
  const heading = document.createElement("strong")
  fragment.append(heading)
  custom.content = {"": body, header: fragment}
  custom.props = {title: "Начало", lifecycle}
  parent.append(custom)
  const title = custom.querySelector("h2")
  body.dispatchEvent(new Event("click", {bubbles: true}))
  custom.title = "Атрибут"
  expect(custom.props.title).toBe("Атрибут")
  expect(title.textContent).toBe("Атрибут:1")
  destination.append(custom)
  custom.props = {title: "Props", lifecycle}
  expect(custom.querySelector("h2")).toBe(title)
  expect(custom.querySelector("input")).toBe(body)
  expect(custom.querySelector("header strong")).toBe(heading)
  expect(body.value).toBe("Пользовательское значение")
  expect(lifecycle).toEqual({mounts: 1, cleanups: 0})
  custom.remove()
  expect(lifecycle.cleanups).toBe(1)
  parent.append(custom)
  expect(custom.querySelector("input")).toBe(body)
  expect(custom.querySelector("header strong")).toBe(heading)
  expect(title.textContent).toBe("Props:1")
  expect(lifecycle.mounts).toBe(2)
  custom.dispose()
  expect(lifecycle.cleanups).toBe(2)
})

test("consumed Fragment не оживает в другом root, cleanup не удаляет переданный Node", () => {
  const document = createDocument()
  const first = document.createElement("div")
  const second = document.createElement("div")
  const fragment = document.createDocumentFragment()
  const node = document.createElement("button")
  fragment.append(node)
  const left = createRoot(first)
  const right = createRoot(second)
  try {
    left.render(Pane, {title: "A"}, {content: {"": fragment}})
    right.render(Pane, {title: "B"}, {content: {"": fragment}})
    expect(first.querySelector("button")).toBe(node)
    expect(second.querySelector("button")).toBeNull()
    right.render(Pane, {title: "B"}, {content: {"": node}})
    expect(second.querySelector("button")).toBe(node)
    left.unmount()
    expect(second.querySelector("button")).toBe(node)
    right.render(Pane, {title: "B2"}, {content: {"": fragment}})
    expect(second.querySelector("button")).toBeNull()
  } finally { left.unmount(); right.unmount() }
})

test("content отклоняет foreign Document, повторные Nodes и неизвестные роли до изменения дерева", () => {
  const document = createDocument()
  const host = document.createElement("div")
  const node = document.createElement("button")
  const root = createRoot(host)
  try {
    root.render(Pane, {title: "A"}, {content: {"": node}})
    const section = host.firstChild
    expect(() => root.render(Pane, {title: "B"}, {content: {"": createDocument().createElement("b")}})).toThrow("receiving Document")
    expect(() => root.render(Pane, {title: "B"}, {content: {"": node, header: node}})).toThrow("more than once")
    expect(() => root.render(Pane, {title: "B"}, {content: {unknown: node}})).toThrow("Unknown DOM content slot")
    expect(host.firstChild).toBe(section)
    expect(host.querySelector("button")).toBe(node)
  } finally { root.unmount() }
})

test("html prepared component занимает собственный диапазон между prefix и suffix", () => {
  const document = createDocument()
  const host = document.createElement("div")
  document.append(host)
  const lifecycle = {mounts: 0, cleanups: 0}
  const node = document.createElement("button")
  const content = {"": node}
  const program = compile((state: {title: string, visible?: boolean}) => html`<div>prefix ${state.visible === false ? null : {type: Pane, props: {...state, lifecycle}, content}} suffix</div>`)
  const instance = program.mount(host, {title: "До"})
  try {
    const outer = host.querySelector("div")!
    const prefix = outer.firstChild
    const suffix = outer.lastChild
    expect(outer.textContent).toBe("prefix До:0 suffix")
    expect(outer.querySelector("button")).toBe(node)
    node.dispatchEvent(new Event("click", {bubbles: true}))
    instance.update({title: "После"})
    expect(outer.textContent).toBe("prefix После:1 suffix")
    expect(outer.firstChild).toBe(prefix)
    expect(outer.lastChild).toBe(suffix)
    expect(outer.querySelector("button")).toBe(node)
    instance.update({title: "Removed", visible: false})
    expect(outer.textContent).toBe("prefix  suffix")
    expect(outer.firstChild).toBe(prefix)
    expect(outer.lastChild).toBe(suffix)
    expect(node.parentNode).toBeNull()
  } finally { instance.dispose() }
  expect(host.childNodes).toHaveLength(0)
  expect(lifecycle).toEqual({mounts: 1, cleanups: 1})
})

test("HTML property bindings применяют props/content к одному custom constructor", () => {
  const document = createDocument()
  const host = document.createElement("div")
  document.append(host)
  let constructors = 0
  class ReadyPane extends Pane {
    constructor(...args: any[]) { super(...args); constructors++ }
  }
  document.customElementRegistry.define("html-pane", ReadyPane as never, {extends: "div"})
  const node = document.createElement("button")
  const content = {"": node}
  const program = compile((state: {title: string}) => html`<div is="html-pane" .props=${state} .content=${content} data-title=${state.title}></div>`)
  const instance = program.mount(host, {title: "До"})
  try {
    const custom = host.querySelector('[is="html-pane"]')!
    expect(constructors).toBe(1)
    expect(custom.querySelector("button")).toBe(node)
    instance.update({title: "После"})
    expect(constructors).toBe(1)
    expect(custom.getAttribute("data-title")).toBe("После")
    expect(custom.querySelector("h2")!.textContent).toBe("После:0")
    expect(custom.querySelector("button")).toBe(node)
  } finally { instance.dispose() }
})

test("cleanup первого HTML-диапазона не удаляет Node, принятый соседним диапазоном того же parent", () => {
  const document = createDocument()
  const host = document.createElement("div")
  const node = document.createElement("button")
  let clicks = 0
  node.addEventListener("click", () => { clicks++ })
  const left = compile(() => html`${node}`).mount(host, undefined)
  const right = compile(() => html`${node}`).mount(host, undefined)
  left.dispose()
  expect(host.querySelector("button")).toBe(node)
  expect(right.rootNodes).toContain(node)
  node.dispatchEvent(new Event("click"))
  expect(clicks).toBe(1)
  right.dispose()
  expect(node.parentNode).toBeNull()
})

test("отклонённое обновление возвращает DOM content без disconnect/remount его собственного компонента", () => {
  const document = createDocument({elementFactories: {"test-object": owner => {
    const element = new Element(owner, "test-object")
    let value = 0
    Object.defineProperty(element, "x", {get: () => value, set(next: number) {
      if (next === 2) throw new Error("Rejected host patch")
      value = next
    }})
    return element
  }}})
  const shell = document.createElement("div")
  const host = document.createElement("div")
  const sourceHost = document.createElement("aside")
  shell.append(host, sourceHost)
  document.append(shell)
  const childLifecycle = {mounts: 0, cleanups: 0}
  const raw = new Pane(document, {title: "Nested", lifecycle: childLifecycle})
  const replacement = document.createElement("button")
  sourceHost.append(replacement)
  const root = createRoot(host)
  try {
    root.render(Pane, {title: "Parent"}, {content: {"": [raw, {type: components.SpatialHost, props: {x: 1, text: ""}}]}})
    const original = raw.querySelector("h2")!
    original.dispatchEvent(new Event("click", {bubbles: true}))
    expect(original.textContent).toBe("Nested:1")
    raw.tabIndex = 0
    raw.focus()
    expect(() => root.render(Pane, {title: "Rejected"}, {content: {"": [replacement, {type: components.SpatialHost, props: {x: 2, text: ""}}]}})).toThrow("Rejected host patch")
    expect(raw.querySelector("h2") === original).toBeTrue()
    expect(original.textContent).toBe("Nested:1")
    expect(childLifecycle).toEqual({mounts: 1, cleanups: 0})
    expect(document.activeElement === raw).toBeTrue()
    expect(replacement.parentNode).toBe(sourceHost)
  } finally { root.unmount(); raw.dispose() }
})

test("declarative fragment и innerHTML однократно передают actual DOM children в готовые slots", () => {
  const document = createDocument()
  const body = document.createElement("body")
  document.append(body)
  const parentLifecycle = {mounts: 0, cleanups: 0}
  const childLifecycle = {mounts: 0, cleanups: 0}
  class Parent extends Pane {
    connectedCallback() { if (this.props === undefined) this.props = {title: this.title || "Parent", lifecycle: parentLifecycle} }
  }
  class Child extends Pane {
    connectedCallback() { if (this.props === undefined) this.props = {title: "Child", lifecycle: childLifecycle} }
  }
  document.customElementRegistry.define("dom-panel", Parent as never, {extends: "div"})
  document.customElementRegistry.define("dom-child", Child as never, {extends: "div"})
  const fragment = parseFragment(document, '<div is="dom-panel" title="Declared"><h3 slot="header" id="header">Heading</h3><p id="body">Body</p><div is="dom-child"></div></div>', body)
  const parent = fragment.firstChild as any
  const header = parent.querySelector("#header")!
  const content = parent.querySelector("#body")!
  const child = parent.querySelector('[is="dom-child"]')!
  body.append(fragment)
  const childTitle = child.querySelector("h2")!
  expect(header.parentNode === parent.querySelector("header")).toBeTrue()
  expect(content.parentNode === parent.querySelector("main")).toBeTrue()
  expect(header.getAttribute("slot")).toBe("header")
  childTitle.dispatchEvent(new Event("click", {bubbles: true}))
  expect(childTitle.textContent).toBe("Child:1")
  parent.props = {title: "Updated", lifecycle: parentLifecycle}
  const destination = document.createElement("aside")
  body.append(destination)
  destination.append(parent)
  expect(child.querySelector("h2") === childTitle).toBeTrue()
  expect(content.parentNode === parent.querySelector("main")).toBeTrue()
  expect(childLifecycle).toEqual({mounts: 1, cleanups: 0})
  parent.remove()
  expect(parentLifecycle.cleanups).toBe(1)
  expect(childLifecycle.cleanups).toBe(1)
  body.append(parent)
  expect(parent.querySelector("#header") === header).toBeTrue()
  expect(parent.querySelector("#body") === content).toBeTrue()
  expect(parent.querySelector('[is="dom-child"]') === child).toBeTrue()
  expect(childTitle.textContent).toBe("Child:1")
  expect(childLifecycle.mounts).toBe(2)
  parent.remove()
  body.innerHTML = '<div is="dom-panel"><b slot="header">HTML header</b><p>HTML body</p></div>'
  expect(body.querySelector('[is="dom-panel"] header')!.textContent).toBe("HTML header")
  expect(body.querySelector('[is="dom-panel"] main')!.textContent).toBe("HTML body")
  body.replaceChildren()
})

test("CE getters принимают только успешные props/content; тот же input можно повторить после rollback", () => {
  const document = createDocument()
  const body = document.createElement("body")
  document.append(body)
  const gate = {reject: false}
  const custom = new Pane(document, {title: "Accepted", gate})
  const original = document.createElement("b")
  custom.content = {"": original}
  body.append(custom)
  const acceptedProps = custom.props
  const acceptedContent = custom.content
  const nextProps = {title: "Retry", gate}
  gate.reject = true
  expect(() => { custom.props = nextProps }).toThrow("Rejected component input")
  expect(custom.props).toBe(acceptedProps)
  const nextNode = document.createElement("strong")
  const nextContent = {"": nextNode}
  expect(() => { custom.content = nextContent }).toThrow("Rejected component input")
  expect(custom.content).toBe(acceptedContent)
  expect(custom.querySelector("b") === original).toBeTrue()
  gate.reject = false
  custom.props = nextProps
  custom.content = nextContent
  expect(custom.props.title).toBe("Retry")
  expect(custom.props.gate).toBe(gate)
  expect(custom.querySelector("strong") === nextNode).toBeTrue()
  custom.dispose()
})

test("connected failure сохраняет initial DOM input и разрешает retry исправленными props", () => {
  const document = createDocument()
  const body = document.createElement("body")
  document.append(body)
  document.customElementRegistry.define("retry-panel", Pane, {extends: "div"})
  const custom = document.createElement("div", {is: "retry-panel"}) as any
  custom.title = "bad"
  const node = document.createElement("b")
  custom.append(node)
  expect(() => body.append(custom)).toThrow("Initial render rejected")
  expect(custom.firstChild === node).toBeTrue()
  custom.props = {title: "good"}
  expect(node.parentNode === custom.querySelector("main")).toBeTrue()
  expect(custom.querySelector("h2")!.textContent).toBe("good:0")
  custom.dispose()
})

test("initial DOM children и explicit content не объединяются молча", () => {
  const document = createDocument()
  const body = document.createElement("body")
  document.append(body)
  document.customElementRegistry.define("exclusive-panel", Pane, {extends: "div"})
  const custom = document.createElement("div", {is: "exclusive-panel"}) as any
  const authored = document.createElement("b")
  const explicit = document.createElement("strong")
  custom.append(authored)
  custom.content = {"": explicit}
  expect(() => body.append(custom)).toThrow("initial DOM children")
  expect(custom.firstChild === authored).toBeTrue()
  expect(custom.querySelector("h2")).toBeNull()
  custom.replaceChildren()
  custom.props = {title: "Retry"}
  expect(custom.querySelector("strong") === explicit).toBeTrue()
  custom.dispose()
})

test("HTML rootNodes не раскрывает внутренние anchors готового компонента", () => {
  const document = createDocument()
  const host = document.createElement("div")
  const instance = compile(() => html`${{type: Pane, props: {title: "Root"}}}`).mount(host, undefined)
  try {
    expect(instance.rootNodes).toHaveLength(1)
    expect(instance.rootNodes[0] === host.firstElementChild).toBeTrue()
  } finally { instance.dispose() }
})

test("HTML prepared layout effect получает ref уже в переданном DOM host", () => {
  const document = createDocument()
  const host = document.createElement("div")
  document.append(host)
  const ref: {current: Element | null} = {current: null}
  let connected = false
  const props = {element: ref, onLayout(element: Element) { connected = element.isConnected }}
  const instance = compile(() => html`<section>${{type: components.ConnectedRef, props}}</section>`).mount(host, undefined)
  try { expect(connected).toBeTrue() } finally { instance.dispose() }
  expect(ref.current).toBeNull()
})

test("отклонённый HTML mount освобождает prepared lifecycle и возвращает переданные raw Nodes", () => {
  const document = createDocument()
  const shell = document.createElement("div")
  const source = document.createElement("div")
  const destination = document.createElement("div")
  shell.append(source, destination)
  document.append(shell)
  const raw = document.createElement("b")
  source.append(raw)
  const lifecycle = {mounts: 0, cleanups: 0}
  const ready = {type: Pane, props: {title: "Prepared", lifecycle}, content: {"": raw}}
  const program = compile(() => html`<section>${ready}${{invalid: true}}</section>`)
  expect(() => program.mount(destination, undefined)).toThrow("primitive value")
  expect(raw.parentNode === source).toBeTrue()
  expect(destination.childNodes).toHaveLength(0)
  expect(lifecycle).toEqual({mounts: 0, cleanups: 0})
})

test("ошибка cleanup одного prepared child не оставляет соседний lifecycle и DOM", () => {
  const document = createDocument()
  const host = document.createElement("div")
  document.append(host)
  let secondCleanup = 0
  const first = {type: components.Cleanup, props: {cleanup() { throw new Error("Rejected cleanup") }}}
  const second = {type: components.Cleanup, props: {cleanup() { secondCleanup++ }}}
  const instance = compile(() => html`${first}${second}`).mount(host, undefined)
  expect(() => instance.dispose()).toThrow("Rejected cleanup")
  expect(secondCleanup).toBe(1)
  expect(host.childNodes).toHaveLength(0)
})
