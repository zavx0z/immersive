import {expect, test} from "bun:test"
import {createDocument, Event, HTMLElement} from "@zavx0z/immersive-dom"
import {bindText, bindEvent, defineCompiledTemplate, writeBinding} from "@zavx0z/immersive-template/compiled"
import {componentElement, createRoot, useEffect, useState} from "../src/index.ts"

test("один готовый компонент работает через ComponentRoot и Custom Element без второй реализации", () => {
  const document = createDocument()
  let effects = 0, cleanups = 0, renders = 0
  const template = defineCompiledTemplate<{label: string}>({
    bindingCount: 2,
    mount(document) {
      const button = document.createElement("button")
      const text = document.createTextNode("")
      button.append(text)
      return {nodes: [button], bindings: [bindText(text), bindEvent(button, "click")]}
    },
    render(props, values) {
      renders++
      const [count, setCount] = useState(0)
      useEffect(() => { effects++; return () => { cleanups++ } }, [])
      writeBinding(values, 0, `${props.label}:${count}`)
      writeBinding(values, 1, () => setCount(count + 1))
    },
  })
  const main = document.createElement("main")
  const direct = document.createElement("section")
  const destination = document.createElement("section")
  document.append(main)
  main.append(direct, destination)
  const directRoot = createRoot(direct)
  const Element = componentElement(template, {attributes: {label: value => value ?? ""}})
  document.customElementRegistry.define("test-counter", Element)
  const custom = document.createElement("test-counter") as InstanceType<typeof Element>
  custom.setAttribute("label", "Первый")
  directRoot.render(template, {label: "Первый"})
  main.append(custom)
  expect(custom.textContent).toBe(direct.textContent)
  const button = custom.querySelector("button")!
  button.dispatchEvent(new Event("click", {bubbles: true}))
  expect(custom.textContent).toBe("Первый:1")
  custom.props = {label: "Второй"}
  expect(custom.querySelector("button")).toBe(button)
  expect(custom.textContent).toBe("Второй:1")
  const beforeMove = renders
  destination.append(custom)
  expect(custom.querySelector("button")).toBe(button)
  expect(custom.textContent).toBe("Второй:1")
  expect(renders, "Перенос не рендерит компонент заново").toBe(beforeMove)
  expect(effects).toBe(2)
  expect(cleanups).toBe(0)
  custom.remove()
  expect(cleanups).toBe(1)
  expect(custom.childNodes).toHaveLength(0)
  directRoot.unmount()
  expect(cleanups).toBe(2)
})

test("отсоединённый компонент накапливает props без исполнения, позднее определение использует атрибуты", () => {
  const document = createDocument()
  let renders = 0
  const template = defineCompiledTemplate<{label: string}>({
    bindingCount: 1,
    mount(document) {
      const text = document.createTextNode("")
      return {nodes: [text], bindings: [bindText(text)]}
    },
    render(props, values) { renders++; writeBinding(values, 0, props.label) },
  })
  const pending = document.createElement("late-label")
  pending.setAttribute("label", "Готово")
  document.append(pending)
  document.customElementRegistry.define("late-label", componentElement(template, {
    attributes: {label: value => value ?? ""},
  }))
  expect(pending.textContent).toBe("Готово")
  expect(renders).toBe(1)
  const Element = componentElement(template)
  document.customElementRegistry.define("direct-label", Element)
  const detached = document.createElement("direct-label") as InstanceType<typeof Element>
  detached.props = {label: "Один"}
  detached.props = {label: "Два"}
  expect(renders).toBe(1)
  pending.append(detached)
  expect(detached.textContent).toBe("Два")
  expect(renders).toBe(2)
})

test("удалённый соседним callback компонент не исполняется по устаревшей connected reaction", () => {
  const document = createDocument()
  let renders = 0
  const template = defineCompiledTemplate({
    bindingCount: 0,
    mount() { return {nodes: [], bindings: []} },
    render() { renders++ },
  })
  const root = document.createElement("main")
  document.append(root)
  document.customElementRegistry.define("removed-component", componentElement(template))
  const removed = document.createElement("removed-component")
  class Remover extends HTMLElement {
    connectedCallback() { removed.remove() }
  }
  document.customElementRegistry.define("remover-element", Remover)
  root.append(document.createElement("remover-element"), removed)
  expect(removed.isConnected).toBe(false)
  expect(renders).toBe(0)
  expect(removed.childNodes).toHaveLength(0)
})
