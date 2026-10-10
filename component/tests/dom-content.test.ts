import {expect, test} from "bun:test"
import {createDocument, Element, Event, parseFragment} from "@zavx0z/immersive-dom"
import {bindChild, bindConditional, bindEvent, bindProperty, bindRef, bindText, defineCompiledTemplate, slotContents, writeBinding} from "@zavx0z/immersive-template/compiled"
import {html, compile} from "@zavx0z/immersive-template"
import {composeSlot} from "../slot/index.ts"
import {component, componentElement, createRoot, useEffect, useLayoutEffect, useState} from "../src/index.ts"

function pane(lifecycle: {mounts: number, cleanups: number}) {
  return defineCompiledTemplate<{title: string}>({
    displayName: "ReadyDomPane", slots: ["", "header"], bindingCount: 4,
    mount(document) {
      const section = document.createElement("section")
      const title = document.createElement("h2")
      const text = document.createTextNode("")
      title.append(text)
      const header = document.createElement("header")
      const main = document.createElement("main")
      const headerStart = document.createComment("header")
      const headerEnd = document.createComment("/header")
      const start = document.createComment("default")
      const end = document.createComment("/default")
      header.append(headerStart, headerEnd)
      main.append(start, end)
      section.append(title, header, main)
      return {nodes: [section], bindings: [bindText(text), bindConditional(headerStart, headerEnd), bindChild(start, end), bindEvent(section, "click")]}
    },
    render(props, values) {
      const [count, setCount] = useState(0)
      useEffect(() => {
        lifecycle.mounts++
        return () => { lifecycle.cleanups++ }
      }, [])
      const content = (props as typeof props & {[slotContents]?: Record<string, unknown>})[slotContents]
      writeBinding(values, 0, `${props.title}:${count}`)
      writeBinding(values, 1, composeSlot({content: content?.header as never}))
      writeBinding(values, 2, composeSlot({content: content?.[""] as never}) ?? composeSlot({content: "Пусто"}))
      writeBinding(values, 3, () => setCount(value => value + 1))
    },
  })
}

test("готовый Pane принимает default Node и именованный Fragment в том же Document", () => {
  const document = createDocument()
  const host = document.createElement("div")
  const destination = document.createElement("aside")
  const shell = document.createElement("div")
  document.append(shell)
  shell.append(host, destination)
  const lifecycle = {mounts: 0, cleanups: 0}
  const Pane = pane(lifecycle)
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
    root.render(Pane, {title: "Первый"}, {content})
    expect(fragment.childNodes).toHaveLength(0)
    expect(host.querySelector("button")).toBe(button)
    expect(host.querySelector("header b")).toBe(heading)
    expect(host.querySelector("header")!.textContent).toBe("Заголовок!")
    expect(button.ownerDocument).toBe(document)
    button.dispatchEvent(new Event("click", {bubbles: true}))
    expect(clicks).toBe(1)
    root.render(Pane, {title: "Второй"}, {content})
    expect(host.querySelector("h2")!.textContent).toBe("Второй:1")
    expect(host.querySelector("button")).toBe(button)
    expect(host.querySelector("header b")).toBe(heading)
    destination.append(host)
    expect(host.querySelector("button")).toBe(button)
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

test("custom element использует тот же content ABI и сохраняет accepted Nodes после reconnect", () => {
  const document = createDocument()
  const parent = document.createElement("div")
  const destination = document.createElement("aside")
  const shell = document.createElement("div")
  document.append(shell)
  shell.append(parent, destination)
  const lifecycle = {mounts: 0, cleanups: 0}
  const Pane = pane(lifecycle)
  const ReadyPane = componentElement(Pane, {initialProps: {title: "Начало"}, attributes: {title: value => value ?? ""}})
  document.customElementRegistry.define("ready-pane", ReadyPane)
  const custom = new ReadyPane()
  const body = document.createElement("input")
  body.value = "Пользовательское значение"
  const fragment = document.createDocumentFragment()
  const heading = document.createElement("strong")
  fragment.append(heading)
  custom.content = {"": body, header: fragment}
  parent.append(custom)
  const section = custom.querySelector("section")!
  body.dispatchEvent(new Event("click", {bubbles: true}))
  custom.setAttribute("title", "Атрибут")
  expect(custom.querySelector("h2")!.textContent).toBe("Атрибут:1")
  destination.append(custom)
  custom.props = {title: "Props"}
  expect(custom.querySelector("section")).toBe(section)
  expect(custom.querySelector("input")).toBe(body)
  expect(custom.querySelector("header strong")).toBe(heading)
  expect(body.value).toBe("Пользовательское значение")
  expect(lifecycle).toEqual({mounts: 1, cleanups: 0})
  custom.remove()
  expect(custom.childNodes).toHaveLength(0)
  expect(lifecycle.cleanups).toBe(1)
  parent.append(custom)
  expect(custom.querySelector("input")).toBe(body)
  expect(custom.querySelector("header strong")).toBe(heading)
  expect(custom.querySelector("h2")!.textContent).toBe("Props:0")
  expect(lifecycle.mounts).toBe(2)
  custom.remove()
  expect(lifecycle.cleanups).toBe(2)
})

test("consumed Fragment не оживает в другом root, cleanup не удаляет переданный Node", () => {
  const document = createDocument()
  const first = document.createElement("div")
  const second = document.createElement("div")
  const fragment = document.createDocumentFragment()
  const node = document.createElement("button")
  fragment.append(node)
  const Pane = pane({mounts: 0, cleanups: 0})
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
  } finally {
    left.unmount()
    right.unmount()
  }
})

test("content отклоняет foreign Document, повторные Nodes и неизвестные роли до изменения дерева", () => {
  const document = createDocument()
  const host = document.createElement("div")
  const node = document.createElement("button")
  const Pane = pane({mounts: 0, cleanups: 0})
  const root = createRoot(host)
  try {
    root.render(Pane, {title: "A"}, {content: {"": node}})
    const section = host.firstChild
    expect(() => root.render(Pane, {title: "B"}, {content: {"": createDocument().createElement("b")}})).toThrow("receiving Document")
    expect(() => root.render(Pane, {title: "B"}, {content: {"": node, header: node}})).toThrow("more than once")
    expect(() => root.render(Pane, {title: "B"}, {content: {unknown: node}})).toThrow("Unknown component content slot")
    expect(host.firstChild).toBe(section)
    expect(host.querySelector("button")).toBe(node)
  } finally { root.unmount() }
})

test("html prepared component занимает собственный диапазон между prefix и suffix", () => {
  const document = createDocument()
  const host = document.createElement("div")
  document.append(host)
  const lifecycle = {mounts: 0, cleanups: 0}
  const Pane = pane(lifecycle)
  const node = document.createElement("button")
  const content = {"": node}
  const program = compile((state: {title: string, visible?: boolean}) => html`<div>prefix ${state.visible === false ? null : component(Pane, state, null, content)} suffix</div>`)
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
  expect(node.parentNode).toBeNull()
  expect(lifecycle).toEqual({mounts: 1, cleanups: 1})
})

test("HTML property bindings применяют props/content к одному custom constructor", () => {
  const document = createDocument()
  const host = document.createElement("div")
  document.append(host)
  const Pane = pane({mounts: 0, cleanups: 0})
  const Base = componentElement(Pane)
  let constructors = 0
  class ReadyPane extends Base {
    constructor() {
      super()
      constructors++
    }
  }
  document.customElementRegistry.define("html-pane", ReadyPane)
  const node = document.createElement("button")
  const content = {"": node}
  const program = compile((state: {title: string}) => html`<html-pane .props=${state} .content=${content} data-title=${state.title}></html-pane>`)
  const instance = program.mount(host, {title: "До"})
  try {
    const custom = host.querySelector("html-pane")!
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
  const document = createDocument()
  const shell = document.createElement("div")
  const host = document.createElement("div")
  const sourceHost = document.createElement("aside")
  shell.append(host, sourceHost)
  document.append(shell)
  const childLifecycle = {mounts: 0, cleanups: 0}
  const RawPane = componentElement(pane(childLifecycle), {initialProps: {title: "Nested"}})
  document.customElementRegistry.define("raw-child", RawPane)
  const raw = new RawPane()
  const replacement = document.createElement("button")
  sourceHost.append(replacement)
  const fail = defineCompiledTemplate<{value: number}>({
    bindingCount: 1,
    mount(document) {
      const element = new Element(document, "spatial-value")
      let value = 0
      Object.defineProperty(element, "value", {get: () => value, set(next: number) {
        if (next === 2) throw new Error("Rejected host patch")
        value = next
      }})
      return {nodes: [element], bindings: [bindProperty(element, "value")]}
    },
    render(props, values) { writeBinding(values, 0, props.value) },
  })
  const root = createRoot(host)
  const Pane = pane({mounts: 0, cleanups: 0})
  try {
    root.render(Pane, {title: "Parent"}, {content: {"": [raw, component(fail, {value: 1})]}})
    const original = raw.querySelector("h2")!
    original.dispatchEvent(new Event("click", {bubbles: true}))
    expect(original.textContent).toBe("Nested:1")
    raw.tabIndex = 0
    raw.focus()
    expect(() => root.render(Pane, {title: "Rejected"}, {content: {"": [replacement, component(fail, {value: 2})]}})).toThrow("Rejected host patch")
    expect(raw.querySelector("h2") === original).toBeTrue()
    expect(original.textContent).toBe("Nested:1")
    expect(childLifecycle).toEqual({mounts: 1, cleanups: 0})
    expect(document.activeElement === raw).toBeTrue()
    expect(replacement.parentNode).toBe(sourceHost)
  } finally { root.unmount() }
})

test("declarative fragment и innerHTML однократно передают actual DOM children в готовые slots", () => {
  const document = createDocument()
  const body = document.createElement("body")
  document.append(body)
  const parentLifecycle = {mounts: 0, cleanups: 0}
  const childLifecycle = {mounts: 0, cleanups: 0}
  const Parent = componentElement(pane(parentLifecycle), {initialProps: {title: "Parent"}, attributes: {title: value => value ?? ""}})
  const Child = componentElement(pane(childLifecycle), {initialProps: {title: "Child"}})
  document.customElementRegistry.define("dom-panel", Parent)
  document.customElementRegistry.define("dom-child", Child)
  const fragment = parseFragment(document, '<dom-panel title="Declared"><h3 slot="header" id="header">Heading</h3><p id="body">Body</p><dom-child></dom-child></dom-panel>', body)
  const parent = fragment.firstChild as InstanceType<typeof Parent>
  const header = parent.querySelector("#header")!
  const content = parent.querySelector("#body")!
  const child = parent.querySelector("dom-child")!
  body.append(fragment)
  const childTitle = child.querySelector("h2")!
  expect(header.parentNode === parent.querySelector("header")).toBeTrue()
  expect(content.parentNode === parent.querySelector("main")).toBeTrue()
  expect(header.getAttribute("slot")).toBe("header")
  childTitle.dispatchEvent(new Event("click", {bubbles: true}))
  expect(childTitle.textContent).toBe("Child:1")
  parent.props = {title: "Updated"}
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
  expect(parent.querySelector("dom-child") === child).toBeTrue()
  expect(childLifecycle.mounts).toBe(2)
  parent.remove()
  body.innerHTML = '<dom-panel><b slot="header">HTML header</b><p>HTML body</p></dom-panel>'
  expect(body.querySelector("dom-panel header")!.textContent).toBe("HTML header")
  expect(body.querySelector("dom-panel main")!.textContent).toBe("HTML body")
  body.replaceChildren()
})

test("CE getters принимают только успешные props/content; тот же input можно повторить после rollback", () => {
  const document = createDocument()
  const body = document.createElement("body")
  document.append(body)
  const lifecycle = {mounts: 0, cleanups: 0}
  const base = pane(lifecycle)
  let reject = false
  const ready = defineCompiledTemplate<{title: string}>({...base, render(props, values) {
    if (reject) throw new Error("Rejected component input")
    base.render(props, values)
  }})
  const Ready = componentElement(ready, {initialProps: {title: "Accepted"}})
  document.customElementRegistry.define("accepted-panel", Ready)
  const custom = new Ready()
  const original = document.createElement("b")
  custom.content = {"": original}
  body.append(custom)
  const acceptedProps = custom.props
  const acceptedContent = custom.content
  const nextProps = {title: "Retry"}
  reject = true
  expect(() => { custom.props = nextProps }).toThrow("Rejected component input")
  expect(custom.props).toBe(acceptedProps)
  const nextNode = document.createElement("strong")
  const nextContent = {"": nextNode}
  expect(() => { custom.content = nextContent }).toThrow("Rejected component input")
  expect(custom.content).toBe(acceptedContent)
  expect(custom.querySelector("b") === original).toBeTrue()
  reject = false
  custom.props = nextProps
  custom.content = nextContent
  expect(custom.props).toBe(nextProps)
  expect(custom.querySelector("strong") === nextNode).toBeTrue()
  custom.remove()
})

test("connected failure сохраняет initial DOM input и разрешает retry исправленными props", () => {
  const document = createDocument()
  const body = document.createElement("body")
  document.append(body)
  const base = pane({mounts: 0, cleanups: 0})
  const ready = defineCompiledTemplate<{title: string}>({...base, render(props, values) {
    if (props.title === "bad") throw new Error("Initial render rejected")
    base.render(props, values)
  }})
  const Ready = componentElement(ready, {initialProps: {title: "bad"}})
  document.customElementRegistry.define("retry-panel", Ready)
  const custom = new Ready()
  const node = document.createElement("b")
  custom.append(node)
  expect(captureReportedErrors(() => body.append(custom))).toHaveLength(1)
  expect(custom.firstChild === node).toBeTrue()
  custom.props = {title: "good"}
  expect(node.parentNode === custom.querySelector("main")).toBeTrue()
  expect(custom.querySelector("h2")!.textContent).toBe("good:0")
  custom.remove()
})

test("initial DOM children и explicit content не объединяются молча", () => {
  const document = createDocument()
  const body = document.createElement("body")
  document.append(body)
  const Ready = componentElement(pane({mounts: 0, cleanups: 0}), {initialProps: {title: "Ready"}})
  document.customElementRegistry.define("exclusive-panel", Ready)
  const custom = new Ready()
  const authored = document.createElement("b")
  const explicit = document.createElement("strong")
  custom.append(authored)
  custom.content = {"": explicit}
  expect(captureReportedErrors(() => body.append(custom))).toHaveLength(1)
  expect(custom.firstChild === authored).toBeTrue()
  expect(custom.querySelector("section")).toBeNull()
  custom.replaceChildren()
  custom.props = {title: "Retry"}
  expect(custom.querySelector("strong") === explicit).toBeTrue()
  custom.remove()
})

function captureReportedErrors(callback: () => void): unknown[] {
  const original = Object.getOwnPropertyDescriptor(globalThis, "reportError")
  const errors: unknown[] = []
  Object.defineProperty(globalThis, "reportError", {configurable: true, value: (error: unknown) => { errors.push(error) }})
  try { callback() } finally {
    if (original) Object.defineProperty(globalThis, "reportError", original)
    else Reflect.deleteProperty(globalThis, "reportError")
  }
  return errors
}

test("HTML rootNodes не раскрывает внутренние anchors готового компонента", () => {
  const document = createDocument()
  const host = document.createElement("div")
  const Pane = pane({mounts: 0, cleanups: 0})
  const instance = compile(() => html`${component(Pane, {title: "Root"})}`).mount(host, undefined)
  try {
    expect(instance.rootNodes).toHaveLength(1)
    expect(instance.rootNodes[0] === host.querySelector("section")).toBeTrue()
  } finally { instance.dispose() }
})

test("HTML prepared layout effect получает ref уже в переданном DOM host", () => {
  const document = createDocument()
  const host = document.createElement("div")
  document.append(host)
  const ref: {current: Element | null} = {current: null}
  let connected = false
  const ready = defineCompiledTemplate<{}>({
    bindingCount: 1,
    mount(document) {
      const target = document.createElement("b")
      return {nodes: [target], bindings: [bindRef(target)]}
    },
    render(_props, values) {
      writeBinding(values, 0, ref)
      useLayoutEffect(() => { connected = ref.current!.isConnected }, [])
    },
  })
  const instance = compile(() => html`<section>${component(ready, {})}</section>`).mount(host, undefined)
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
  const ready = component(pane(lifecycle), {title: "Prepared"}, null, {"": raw})
  const program = compile(() => html`<section>${ready}${{invalid: true}}</section>`)
  expect(() => program.mount(destination, undefined)).toThrow("primitive value")
  expect(raw.parentNode === source).toBeTrue()
  expect(destination.childNodes).toHaveLength(0)
  expect(lifecycle).toEqual({mounts: 0, cleanups: 0})
})

test("ошибка cleanup одного prepared child не оставляет соседний lifecycle и DOM", () => {
  const document = createDocument()
  const host = document.createElement("div")
  let secondCleanup = 0
  const ready = (reject: boolean) => defineCompiledTemplate<{}>({
    bindingCount: 0,
    mount(document) { return {nodes: [document.createElement("b")], bindings: []} },
    render() { useEffect(() => () => {
      if (reject) throw new Error("Rejected cleanup")
      secondCleanup++
    }, []) },
  })
  const first = ready(true)
  const second = ready(false)
  const instance = compile(() => html`${component(first, {})}${component(second, {})}`).mount(host, undefined)
  expect(() => instance.dispose()).toThrow("Rejected cleanup")
  expect(secondCleanup).toBe(1)
  expect(host.childNodes).toHaveLength(0)
})
