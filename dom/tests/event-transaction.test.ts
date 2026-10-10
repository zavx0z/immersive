import {expect, test} from "bun:test"
import {createDocument, Event, InputEvent, HTMLElement, observeConnection} from "../src/index.ts"

test("imperative beforeinput завершается DOM task до возврата dispatch и публикует одно состояние", () => {
  const document = createDocument(), parent = document.createElement("main"), input = document.createElement("input")
  parent.append(input)
  document.append(parent)
  const calls: string[] = []
  const task = () => {
    input.value = "accepted"
    calls.push("task")
  }
  parent.addEventListener("beforeinput", () => calls.push("capture"), {capture: true})
  input.addEventListener("beforeinput", event => {
    document.enqueueTask(task)
    document.enqueueTask(task)
    event.preventDefault()
    calls.push("target")
  })
  parent.addEventListener("beforeinput", () => {
    expect(input.value).toBe("")
    calls.push("bubble")
  })
  document.subscribeStateChanges(() => {
    expect(input.value).toBe("accepted")
    calls.push("publish")
  })
  expect(input.dispatchEvent(new InputEvent("beforeinput", {bubbles: true, cancelable: true, data: "x", inputType: "insertText"}))).toBe(false)
  expect(input.value).toBe("accepted")
  expect(calls).toEqual(["capture", "target", "bubble", "task", "publish"])
})

test("event batch сохраняет setter-time CE reactions перед следующим listener statement", () => {
  const document = createDocument(), parent = document.createElement("main")
  document.append(parent)
  const calls: string[] = []
  class Custom extends HTMLElement {
    static observedAttributes = ["value"]
    attributeChangedCallback() { calls.push("attribute") }
  }
  document.customElementRegistry.define("x-field", Custom)
  const field = document.createElement("x-field")
  parent.append(field)
  field.addEventListener("change", () => {
    field.setAttribute("value", "next")
    calls.push("after-setter")
    document.enqueueTask(() => calls.push("task"))
  })
  parent.addEventListener("change", () => calls.push("bubble"))
  field.dispatchEvent(new Event("change", {bubbles: true}))
  expect(calls).toEqual(["attribute", "after-setter", "bubble", "task"])
})

test("native checkbox cancellation и focus события сохраняют default action порядок", () => {
  const document = createDocument(), parent = document.createElement("main"), input = document.createElement("input"), other = document.createElement("button")
  input.type = "checkbox"
  parent.append(input, other)
  document.append(parent)
  const seen: unknown[] = []
  input.addEventListener("click", event => {
    expect(input.checked).toBe(true)
    event.preventDefault()
    document.enqueueTask(() => seen.push(input.checked))
  })
  input.click()
  expect(input.checked).toBe(false)
  expect(seen).toEqual([false])
  input.focus()
  input.addEventListener("blur", () => document.enqueueTask(() => seen.push(document.activeElement === other)))
  other.focus()
  expect(document.activeElement === other).toBe(true)
  expect(seen).toEqual([false, true])
})

test("connection callbacks из event batch завершены перед queued layout, отдельный detach сохраняет cleanup", () => {
  const document = createDocument(), parent = document.createElement("main"), child = document.createElement("div")
  document.append(parent)
  let connected = 0, disconnected = 0
  observeConnection(child, {connected() { connected++ }, disconnected() { disconnected++ }})
  parent.addEventListener("mount", () => {
    parent.append(child)
    document.enqueueTask(() => expect(connected).toBe(1))
  })
  parent.dispatchEvent(new Event("mount"))
  expect(connected).toBe(1)
  child.remove()
  expect(disconnected).toBe(1)
  parent.append(child)
  expect(connected).toBe(2)
})
