import {expect, test} from "bun:test"
import {createDocument, Event, HTMLElement} from "@zavx0z/immersive-dom"
import {SpaceElement} from "@zavx0z/immersive-dom/space"
import {bindChild, bindEvent, bindNode, bindText, defineCompiledTemplate, writeBinding} from "@zavx0z/immersive-template/compiled"
import {compile, html} from "@zavx0z/immersive-template"
import {component, createContext, createRoot, memo, provideContext, useContext, useEffect, useState} from "../src/index.ts"

for (const replacement of ["type", "key"] as const) {
  test(`root ${replacement} replacement откатывает native raw insertion до lifecycle`, () => {
    const document = createDocument()
    const host = document.createElement("div")
    const origin = document.createElement("aside")
    const body = document.createElement("body")
    document.append(body)
    body.append(host, origin)
    let connects = 0
    let disconnects = 0
    let connected = false
    let inspectRollback = false
    const reactionStates: boolean[] = []
    class RawElement extends HTMLElement {
      connectedCallback() {
        if (inspectRollback) reactionStates.push(this.parentNode === origin && host.textContent === "old:1")
        if (!connected && this.isConnected) { connects++; connected = true }
      }
      disconnectedCallback() {
        if (inspectRollback) reactionStates.push(this.parentNode === origin && host.textContent === "old:1")
        if (!this.isConnected) { disconnects++; connected = false }
      }
    }
    document.customElementRegistry.define("review-raw", RawElement)
    const raw = document.createElement("review-raw")
    origin.append(raw)
    const invalid = document.createElement("button")
    origin.append(invalid)
    let mounts = 0
    let cleanups = 0
    const Ready = defineCompiledTemplate<{label: string, reject?: boolean}>({
      displayName: "ReviewRoot", bindingCount: 4,
      mount(document) {
        const button = document.createElement("button")
        const text = document.createTextNode("")
        button.append(text)
        const start = document.createComment("raw")
        const end = document.createComment("/raw")
        const holder = document.createElement("div")
        holder.append(start, end)
        const space = new SpaceElement(document)
        const badStart = document.createComment("invalid")
        const badEnd = document.createComment("/invalid")
        space.append(badStart, badEnd)
        return {nodes: [button, holder, space], bindings: [bindText(text), bindEvent(button, "click"), bindNode(start, end), bindNode(badStart, badEnd)]}
      },
      render(props, values) {
        const [count, setCount] = useState(0)
        useEffect(() => { mounts++; return () => { cleanups++ } }, [])
        writeBinding(values, 0, `${props.label}:${count}`)
        writeBinding(values, 1, () => setCount(value => value + 1))
        writeBinding(values, 2, props.reject ? raw : null)
        writeBinding(values, 3, props.reject ? invalid : null)
      },
    })
    const Other = defineCompiledTemplate({...Ready, displayName: "ReviewOther"})
    const root = createRoot(host)
    try {
      root.render(Ready, {label: "old"}, {key: "old"})
      const nodes = [...host.childNodes]
      const button = host.querySelector("button") as HTMLElement
      const observerStates: boolean[] = []
      const unsubscribe = document.subscribeMutations(() => {
        if (inspectRollback) observerStates.push(host.firstChild === nodes[0] && raw.parentNode === origin && document.activeElement === button)
      })
      button.dispatchEvent(new Event("click"))
      button.focus()
      inspectRollback = true
      expect(() => root.render(replacement === "type" ? Other : Ready, {label: "bad", reject: true}, {key: "new"})).toThrow("Space accepts only spatial elements")
      inspectRollback = false
      expect(host.childNodes.length === nodes.length && nodes.every((node, index) => host.childNodes[index] === node)).toBeTrue()
      expect(document.activeElement === button).toBeTrue()
      expect(raw.parentNode === origin).toBeTrue()
      expect(invalid.parentNode === origin).toBeTrue()
      expect([connects, disconnects, mounts, cleanups]).toEqual([1, 0, 1, 0])
      expect(reactionStates.length > 0 && reactionStates.every(Boolean)).toBeTrue()
      expect(observerStates.length > 0 && observerStates.every(Boolean)).toBeTrue()
      unsubscribe()
      root.render(Ready, {label: "accepted"}, {key: "old"})
      expect(button.textContent).toBe("accepted:1")
      button.dispatchEvent(new Event("click"))
      expect(button.textContent).toBe("accepted:2")
      expect(host.childNodes.length === nodes.length && nodes.every((node, index) => host.childNodes[index] === node)).toBeTrue()
    } finally { root.unmount() }
    expect(cleanups).toBe(1)
  })
}

test("reused memo root и HTML prepared value принимают новый context без remount", () => {
  const Theme = createContext("fallback")
  const Ready = memo(defineCompiledTemplate<Record<string, never>>({
    displayName: "ReviewContext", bindingCount: 1,
    mount(document) {
      const span = document.createElement("span")
      const text = document.createTextNode("")
      span.append(text)
      return {nodes: [span], bindings: [bindText(text)]}
    },
    render(_props, values) { writeBinding(values, 0, useContext(Theme)) },
  }), () => true)
  const document = createDocument()
  const host = document.createElement("div")
  const root = createRoot(host)
  try {
    root.render(provideContext(Theme, "first", component(Ready, {})))
    const span = host.querySelector("span")
    root.render(provideContext(Theme, "next", component(Ready, {})))
    expect(host.textContent).toBe("next")
    expect(host.querySelector("span")).toBe(span)
    root.batch(() => {
      root.render(provideContext(Theme, "discarded", component(Ready, {})))
      root.render(component(Ready, {}))
    })
    expect(host.textContent).toBe("fallback")
  } finally { root.unmount() }
  const program = compile((state: {value: string}) => html`prefix ${provideContext(Theme, state.value, component(Ready, {}))} suffix`)
  const instance = program.mount(host, {value: "HTML first"})
  try {
    const span = host.querySelector("span")
    instance.update({value: "HTML next"})
    expect(host.textContent).toBe("prefix HTML next suffix")
    expect(host.querySelector("span")).toBe(span)
  } finally { instance.dispose() }
})

test("memo-skipped descendants сохраняют новый inherited context для следующего state render", () => {
  const Current = createContext("current default")
  const Later = createContext("later default")
  let switchContext: () => void = () => { throw new Error("not mounted") }
  const Child = memo(defineCompiledTemplate<Record<string, never>>({
    displayName: "ReviewLaterContext", bindingCount: 1,
    mount(document) {
      const text = document.createTextNode("")
      return {nodes: [text], bindings: [bindText(text)]}
    },
    render(_props, values) {
      const [later, setLater] = useState(false)
      switchContext = () => setLater(true)
      writeBinding(values, 0, useContext(later ? Later : Current))
    },
  }), () => true)
  const Parent = memo(defineCompiledTemplate<Record<string, never>>({
    displayName: "ReviewContextParent", bindingCount: 1,
    mount(document) {
      const start = document.createComment("child")
      const end = document.createComment("/child")
      return {nodes: [start, end], bindings: [bindChild(start, end)]}
    },
    render(_props, values) { writeBinding(values, 0, component(Child, {})) },
  }), () => true)
  const document = createDocument()
  const host = document.createElement("div")
  const root = createRoot(host)
  try {
    root.render(provideContext(Current, "same", component(Parent, {})))
    const nodes = [...host.childNodes]
    root.render(provideContext(Current, "same", provideContext(Later, "accepted later", component(Parent, {}))))
    expect(host.textContent).toBe("same")
    switchContext()
    expect(host.textContent).toBe("accepted later")
    expect(nodes.every((node, index) => host.childNodes[index] === node)).toBeTrue()
  } finally { root.unmount() }
})
