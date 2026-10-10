import {expect, test} from "bun:test"
import {createDocument, createDomRoot, Event, HTMLElement} from "@zavx0z/immersive-dom"
import {DisplayElement} from "@zavx0z/immersive-dom/display"
import {compile, html} from "@zavx0z/immersive-template"
import {components} from "./fixture.ts"

for (const replacement of ["type", "key"] as const) {
  test(`root ${replacement} replacement откатывает native raw insertion до lifecycle`, () => {
    const document = createDocument()
    const host = document.createElement("div")
    const origin = document.createElement("aside")
    const body = document.createElement("body")
    document.append(body)
    body.append(host, origin)
    const accepted = new DisplayElement(document)
    const transferred = new DisplayElement(document)
    const invalid = document.createElement("button")
    origin.append(transferred, invalid)
    const root = createDomRoot(host)
    const lifecycle = {setups: 0, cleanups: 0}
    const props = {label: "old", lifecycle}
    root.render(components.Atomic, props, {content: {"": accepted}})
    const previous = host.firstElementChild!
    const button = host.querySelector("button") as HTMLElement
    button.dispatchEvent(new Event("click"))
    button.focus()
    let publications = 0
    const stop = document.subscribeMutations(() => { publications++ })
    try {
      expect(() => root.render(replacement === "type" ? components.AtomicOther : components.Atomic, {label: "rejected", lifecycle}, {
        ...(replacement === "key" ? {key: "next"} : {}), content: {"": [transferred, invalid]},
      })).toThrow("Space accepts only spatial elements")
      expect(host.firstElementChild).toBe(previous)
      expect(host.querySelector("button")).toBe(button)
      expect(button.textContent).toBe("old:1")
      expect(document.activeElement).toBe(button)
      expect(transferred.parentNode).toBe(origin)
      expect(invalid.parentNode).toBe(origin)
      expect(accepted.parentNode).toBe(host.querySelector("space"))
      expect([lifecycle.setups, lifecycle.cleanups]).toEqual([1, 0])
      expect(publications).toBe(0)
      root.render(components.Atomic, {label: "updated", lifecycle}, {content: {"": accepted}})
      button.dispatchEvent(new Event("click"))
      expect(button.textContent).toBe("updated:2")
    } finally { stop(); root.unmount() }
    expect(lifecycle.cleanups).toBe(1)
  })
}

test("reused root и HTML construction принимают новый context без remount", () => {
  const document = createDocument()
  const host = document.createElement("div")
  document.append(host)
  const value = (text: string) => ({type: components.ContextText, props: {suffix: "html"}, context: {context: components.Theme, value: text, parent: null}})
  const view = compile((text: string) => html`prefix ${value(text)} suffix`).mount(host, "first")
  try {
    const button = host.querySelector("button")!
    button.dispatchEvent(new Event("click"))
    view.update("next")
    expect(host.querySelector("button")).toBe(button)
    expect(host.textContent).toBe("prefix next:html:1 suffix")
  } finally { view.dispose() }
})

test("descendant сохраняет принятый inherited context для следующего hook state render", () => {
  const document = createDocument()
  const host = document.createElement("div")
  document.append(host)
  const root = createDomRoot(host)
  const content = {"": {type: components.ContextText, props: {suffix: "child"}}}
  try {
    root.render(components.Pane, {}, {content, context: {context: components.Theme, value: "first", parent: null}})
    const button = host.querySelector("button")!
    root.render(components.Pane, {}, {content, context: {context: components.Theme, value: "next", parent: null}})
    button.dispatchEvent(new Event("click"))
    expect(host.querySelector("button")).toBe(button)
    expect(button.textContent).toBe("next:child:1")
  } finally { root.unmount() }
})
