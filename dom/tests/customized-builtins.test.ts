import {expect, test} from "bun:test"
import {createDocument, CustomElementRegistry, HTMLElement, HTMLButtonElement, HTMLInputElement, HTMLTextAreaElement, HTMLOptionElement, HTMLVideoElement, DOMGroup, observeConnection, serializeFragment} from "../src/index.ts"
import type {Document} from "../src/index.ts"

function root(document: Document) {
  const host = document.createElement("main")
  document.append(host)
  return host
}

test("customized built-in is the actual native class, without wrapper or adapter", () => {
  const document = createDocument(), host = root(document)
  const calls: string[] = []
  class Counter extends HTMLButtonElement {
    count = 0
    constructor(document: Document) {
      super(document)
      observeConnection(this, {connected: () => calls.push("scope-connect"), disconnected: () => calls.push("scope-disconnect")})
    }
    set props(value: {count: number}) { this.count = value.count; this.textContent = String(value.count) }
    connectedCallback() { calls.push("ce-connect") }
    disconnectedCallback() { calls.push("ce-disconnect") }
  }
  document.customElementRegistry.define("x-counter", Counter, {extends: "button"})
  const button = document.createElement("button", {is: "x-counter"}) as Counter
  expect(button).toBeInstanceOf(Counter)
  expect(button).toBeInstanceOf(HTMLButtonElement)
  expect(button.localName).toBe("button")
  expect(button.ownerDocument).toBe(document)
  expect(button.hasAttributes()).toBe(false)
  expect(button.childNodes).toEqual([])
  expect(document.customElementRegistry.get("x-counter") === Counter).toBe(true)
  button.props = {count: 3}
  host.append(button)
  expect(host.children).toEqual([button])
  expect(calls).toEqual(["ce-connect", "scope-connect"])
  button.focus()
  expect(document.activeElement).toBe(button)
  const beside = document.createElement("div")
  host.append(beside)
  beside.append(button)
  expect(document.activeElement).toBe(button)
  expect(calls.filter(call => call === "scope-connect")).toHaveLength(1)
  expect(calls).not.toContain("scope-disconnect")
  expect(serializeFragment(beside)).toBe('<button is="x-counter">3</button>')
  button.remove()
  expect(calls.slice(-2)).toEqual(["ce-disconnect", "scope-disconnect"])
  expect(document.createElement("x-counter")).not.toBeInstanceOf(Counter)
  expect(new Counter(document).localName).toBe("button")
})

test("HTML is selects the same constructor, is binding is fixed at creation and registry remains local", () => {
  const document = createDocument(), host = root(document)
  let constructed = 0
  class Fancy extends HTMLButtonElement {
    constructor(document: Document) { super(document); constructed++ }
  }
  document.customElementRegistry.define("x-fancy", Fancy, {extends: "button"})
  host.innerHTML = '<button is="x-fancy">Child</button><button is="x-later">Later</button>'
  const first = host.children[0]!, later = host.children[1]!
  expect(first).toBeInstanceOf(Fancy)
  expect(constructed).toBe(1)
  expect(first.textContent).toBe("Child")
  later.setAttribute("is", "x-fancy")
  document.customElementRegistry.upgrade(host)
  expect(later).not.toBeInstanceOf(Fancy)
  class Later extends HTMLButtonElement {}
  document.customElementRegistry.define("x-later", Later, {extends: "button"})
  expect(later).toBeInstanceOf(Later)
  const ordinary = document.createElement("button")
  ordinary.setAttribute("is", "x-fancy")
  host.append(ordinary)
  document.customElementRegistry.upgrade(host)
  expect(ordinary).not.toBeInstanceOf(Fancy)
  const other = createDocument()
  expect(other.createElement("button", {is: "x-fancy"})).not.toBeInstanceOf(Fancy)
})

test("late customized input upgrade preserves dirty state, selection, focus, identity and children", () => {
  const document = createDocument(), host = root(document)
  const input = document.createElement("input", {is: "x-edit"})
  input.defaultValue = "default"
  input.value = "typed"
  input.setSelectionRange(1, 4, "backward")
  host.append(input)
  input.focus()
  const calls: unknown[] = []
  class Edit extends HTMLInputElement {
    static observedAttributes = ["value"]
    initialized = true
    attributeChangedCallback(...args: unknown[]) { calls.push(args.slice(0, 3)) }
    connectedCallback() { calls.push("connected") }
  }
  document.customElementRegistry.define("x-edit", Edit, {extends: "input"})
  expect(host.firstChild).toBe(input)
  expect(input).toBeInstanceOf(Edit)
  expect(input.value).toBe("typed")
  expect(input.defaultValue).toBe("default")
  expect([input.selectionStart, input.selectionEnd, input.selectionDirection]).toEqual([1, 4, "backward"])
  expect(document.activeElement).toBe(input)
  expect(calls).toEqual([["value", null, "default"], "connected"])
  document.customElementRegistry.upgrade(host)
  expect(calls).toHaveLength(2)
  const text = document.createElement("textarea", {is: "x-text"})
  const child = document.createTextNode("default")
  text.append(child)
  text.value = "draft"
  text.setSelectionRange(1, 3)
  host.append(text)
  document.customElementRegistry.define("x-text", class extends HTMLTextAreaElement {}, {extends: "textarea"})
  expect(text.firstChild).toBe(child)
  expect(text.value).toBe("draft")
  expect([text.selectionStart, text.selectionEnd]).toEqual([1, 3])
})

test("late native option and media upgrade do not reset native fields or backing state", () => {
  const document = createDocument(), host = root(document)
  const option = document.createElement("option", {is: "x-option"})
  option.selected = true
  const video = document.createElement("video", {is: "x-video"})
  const media = {}
  video.srcObject = media
  video.muted = true
  video.currentTime = 4
  host.append(option, video)
  document.customElementRegistry.define("x-option", class extends HTMLOptionElement {}, {extends: "option"})
  document.customElementRegistry.define("x-video", class extends HTMLVideoElement {}, {extends: "video"})
  expect(option.selected).toBe(true)
  expect(video.srcObject).toBe(media)
  expect(video.muted).toBe(true)
  expect(video.currentTime).toBe(4)
})

test("unsupported roots, mismatched native constructors and forbidden constructor DOM writes fail honestly", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "reportError"), errors: unknown[] = []
  Object.defineProperty(globalThis, "reportError", {configurable: true, value: (error: unknown) => errors.push(error)})
  try {
    const registry = new CustomElementRegistry()
    expect(() => registry.define("x-group", DOMGroup as never, {extends: "div"})).toThrow("HTMLElement")
    expect(() => registry.define("x-spatial", class extends HTMLElement {}, {extends: "space"})).toThrow("Unsupported")
    expect(() => registry.define("x-self", class extends HTMLElement {}, {extends: "x-self"})).toThrow("Unsupported")
    expect(() => registry.define("x-unknown", class extends HTMLElement {}, {extends: "not-html"})).toThrow("Unsupported")
    const document = createDocument()
    document.customElementRegistry.define("x-wrong", class extends HTMLElement {}, {extends: "button"})
    const wrong = document.createElement("button", {is: "x-wrong"})
    expect(wrong).toBeInstanceOf(HTMLButtonElement)
    expect(errors).toHaveLength(1)
    class Broken extends HTMLButtonElement {
      constructor(document: Document) { super(document); this.append("forbidden") }
    }
    document.customElementRegistry.define("x-broken", Broken, {extends: "button"})
    const broken = document.createElement("button", {is: "x-broken"})
    expect(broken).toBeInstanceOf(HTMLButtonElement)
    expect(broken).not.toBeInstanceOf(Broken)
    expect(broken.childNodes).toEqual([])
    expect(errors).toHaveLength(2)
  } finally {
    if (original) Object.defineProperty(globalThis, "reportError", original)
    else Reflect.deleteProperty(globalThis, "reportError")
  }
})

test("native factory ownership and customized definitions cannot promise different constructors", () => {
  class Aside extends HTMLElement { constructor(document: Document) { super(document, "aside") } }
  const document = createDocument({elementFactories: {aside: document => new HTMLElement(document, "aside")}})
  expect(() => document.createElement("aside", {is: "x-aside"})).toThrow("native factory")
  expect(() => document.customElementRegistry.define("x-aside", Aside, {extends: "aside"})).toThrow("native factory")
  const registry = new CustomElementRegistry()
  registry.define("x-aside", Aside, {extends: "aside"})
  expect(() => createDocument({customElementRegistry: registry, elementFactories: {aside: document => new HTMLElement(document, "aside")}})).toThrow("native factory")
  const exactNative = createDocument({elementFactories: {button: () => { throw new Error("not used") }}})
  class Button extends HTMLButtonElement {}
  exactNative.customElementRegistry.define("x-button", Button, {extends: "button"})
  expect(exactNative.createElement("button", {is: "x-button"})).toBeInstanceOf(Button)
})

test("optional generated constructor can use the same Registry construction context without adapter", () => {
  const document = createDocument()
  class Button extends HTMLButtonElement {
    constructor(document?: Document) { super(document!) }
  }
  document.customElementRegistry.define("x-direct", Button, {extends: "button"})
  const Constructor = document.customElementRegistry.get("x-direct")!
  const button = new Constructor()
  expect(button.ownerDocument).toBe(document)
  expect(button.localName).toBe("button")
  expect(button).toBeInstanceOf(Button)
  const fragment = document.createDocumentFragment()
  fragment.append(button)
  expect(serializeFragment(fragment)).toBe('<button is="x-direct"></button>')
})
