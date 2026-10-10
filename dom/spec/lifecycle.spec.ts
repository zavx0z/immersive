/** Публичное поведение одного DOM lifecycle для Element, Custom Element и диапазона. */
import {describe, expect, test} from "bun:test"
import {createDocument, DOMGroup, Event, HTMLElement, observeConnection} from "@zavx0z/immersive-dom"

describe.each(["element", "group"] as const)("Единое подключение %s", targetKind => {
  const document = createDocument(), host = document.createElement("main")
  const left = document.createElement("div"), right = document.createElement("div")
  host.append(left, right)
  document.append(host)
  const element = document.createElement("button")
  const target = targetKind === "group" ? new DOMGroup(document, element) : element
  let mounts = 0, cleanups = 0, events = 0
  observeConnection(target, {connected() { mounts++ }, disconnected() { cleanups++ }})
  element.addEventListener("change", () => document.enqueueTask(() => { events++ }))
  left.append(target)
  element.focus()
  right.append(target)
  element.dispatchEvent(new Event("change"))
  test("identity, состояние и событие принадлежат тому же Document", () => {
    expect(element.ownerDocument).toBe(document)
    expect(right.querySelector("button") === element).toBe(true)
    expect(document.activeElement === element).toBe(true)
    expect([mounts, cleanups, events]).toEqual([1, 0, 1])
    right.removeChild(target)
    expect(cleanups).toBe(1)
  })
})

test("Custom Element callbacks и concrete refs используют одну общую очередь перед layout", () => {
  const document = createDocument(), host = document.createElement("main")
  document.append(host)
  let childRef: HTMLElement | null = null, layout = false
  class Parent extends HTMLElement {
    connectedCallback() {
      document.enqueueTask(() => {
        expect(childRef?.isConnected).toBe(true)
        layout = true
      })
    }
  }
  document.customElementRegistry.define("x-parent", Parent)
  const parent = document.createElement("x-parent"), child = document.createElement("button")
  observeConnection(child, {connected() { childRef = child }, disconnected() { childRef = null }})
  parent.append(child)
  host.append(parent)
  expect(layout).toBe(true)
})
