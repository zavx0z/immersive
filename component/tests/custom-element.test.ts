import {expect, test} from "bun:test"
import {createDocument, Event, HTMLElement, type HTMLButtonElement} from "@zavx0z/immersive-dom"
import {components} from "./fixture.ts"

test("один готовый constructor работает императивно и как customized builtin без адаптера", () => {
  const document = createDocument()
  const host = document.createElement("div")
  const destination = document.createElement("aside")
  document.append(host)
  host.append(destination)
  document.customElementRegistry.define("ready-counter", components.Counter, {extends: "button"})
  const lifecycle = {setups: 0, cleanups: 0}
  const direct = new components.Counter(document, {label: "first", lifecycle})
  const registered = document.createElement("button", {is: "ready-counter"}) as HTMLButtonElement & {props: unknown, dispose(): void}
  registered.props = {label: "first", lifecycle}
  host.append(direct, registered)
  expect(registered).toBeInstanceOf(components.Counter)
  expect(registered.textContent).toBe(direct.textContent)
  registered.dispatchEvent(new Event("click"))
  registered.props = {label: "next", lifecycle}
  expect(registered.textContent).toBe("next:1")
  destination.append(registered)
  expect(destination.firstElementChild).toBe(registered)
  expect([lifecycle.setups, lifecycle.cleanups]).toEqual([2, 0])
  registered.remove()
  expect(lifecycle.cleanups).toBe(1)
  destination.append(registered)
  expect(registered.textContent).toBe("next:1")
  expect(lifecycle.setups).toBe(3)
  registered.dispose()
  direct.dispose()
  expect(lifecycle.cleanups).toBe(3)
})

test("innerHTML принимает actual default/named DOM children до подключения, без Shadow DOM", () => {
  const document = createDocument()
  const host = document.createElement("div")
  document.customElementRegistry.define("ready-pane", components.Pane, {extends: "div"})
  host.innerHTML = '<div is="ready-pane"><h2 slot="header">Heading</h2><p>Body</p></div>'
  const pane = host.firstElementChild!
  const header = pane.querySelector("h2")!
  const body = pane.querySelector("p")!
  document.append(host)
  expect(pane).toBeInstanceOf(components.Pane)
  expect(pane.querySelector("header h2")).toBe(header)
  expect(pane.querySelector("main p")).toBe(body)
  expect(header.parentElement?.parentElement).toBe(pane)
  expect(pane).not.toHaveProperty("shadowRoot")
  pane.remove()
  host.append(pane)
  expect(pane.querySelector("header h2")).toBe(header)
  expect(pane.querySelector("main p")).toBe(body)
  const component = pane as unknown as {dispose(): void}
  component.dispose()
})

test("удалённый соседом uninitialized builtin не выполняет устаревшую connected reaction", () => {
  const document = createDocument()
  const host = document.createElement("div")
  document.append(host)
  document.customElementRegistry.define("ready-plain", components.Plain, {extends: "span"})
  const removed = document.createElement("span", {is: "ready-plain"})
  class Remover extends HTMLElement {
    connectedCallback() { removed.remove() }
  }
  document.customElementRegistry.define("remover-element", Remover)
  host.append(document.createElement("remover-element"), removed)
  expect(removed.isConnected).toBeFalse()
  expect(removed.childNodes).toHaveLength(0)
})

test("initial connected failure сохраняет existing Node и разрешает props retry", () => {
  const document = createDocument()
  const host = document.createElement("div")
  document.append(host)
  document.customElementRegistry.define("ready-failure", components.Failure, {extends: "button"})
  const pending = document.createElement("button", {is: "ready-failure"}) as HTMLButtonElement & {props: unknown, dispose(): void}
  pending.textContent = "initial"
  expect(() => host.append(pending)).toThrow("rejected input")
  expect(host.firstElementChild).toBe(pending)
  expect(pending.textContent).toBe("initial")
  pending.props = {reject: false, value: "ready"}
  expect(host.firstElementChild).toBe(pending)
  expect(pending.textContent).toBe("ready")
  pending.dispose()
})
