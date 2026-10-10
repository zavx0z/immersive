import {expect, test} from "bun:test"
import {createDocument, Event} from "@zavx0z/immersive-dom"
import {compile, html} from "../index.ts"

test("HTML использует общие text/attribute/property/event операции и очищает listener", () => {
  const document = createDocument()
  const host = document.createElement("div")
  let first = 0, second = 0
  const onFirst = () => { first++ }
  const onSecond = {handleEvent() { second++ }}
  type State = {text: string, value: string, disabled: boolean, listener: typeof onFirst | typeof onSecond | null}
  const program = compile((state: State) => html`<label title=${state.text}><input .value=${state.value} disabled=${state.disabled} onclick=${state.listener}>${state.text}</label>`)
  const instance = program.mount(host, {text: "Первый", value: "A", disabled: true, listener: onFirst})
  const input = host.querySelector("input")!
  const text = host.querySelector("label")!.lastChild
  input.dispatchEvent(new Event("click"))
  expect(first).toBe(1)
  instance.update({text: "Второй", value: "B", disabled: false, listener: onSecond})
  expect(host.querySelector("input")).toBe(input)
  expect(host.querySelector("label")!.lastChild).toBe(text)
  expect(host.querySelector("label")!.getAttribute("title")).toBe("Второй")
  expect(input.hasAttribute("disabled")).toBeFalse()
  expect(Reflect.get(input, "value")).toBe("B")
  input.dispatchEvent(new Event("click"))
  expect(first).toBe(1)
  expect(second).toBe(1)
  instance.dispose()
  input.dispatchEvent(new Event("click"))
  expect(second).toBe(1)
})

test("HTML Fragment сохраняется только у текущего binding, новый получатель видит пустой Fragment", () => {
  const document = createDocument()
  const host = document.createElement("div")
  const other = document.createElement("div")
  const fragment = document.createDocumentFragment()
  const node = document.createElement("b")
  fragment.append(node)
  const program = compile((state: {title: string}) => html`<div title=${state.title}>${fragment}</div>`)
  const first = program.mount(host, {title: "A"})
  const second = program.mount(other, {title: "B"})
  try {
    expect(host.querySelector("b")).toBe(node)
    expect(other.querySelector("b")).toBeNull()
    first.update({title: "C"})
    expect(host.querySelector("b")).toBe(node)
  } finally {
    first.dispose()
    second.dispose()
  }
})

test("HTML blueprint cache учитывает actual table/select/raw-text context", () => {
  const document = createDocument()
  const cell = (label: string) => html`<td>${label}</td>`
  const program = compile(cell)
  const row = document.createElement("tr")
  const body = document.createElement("div")
  const rowInstance = program.mount(row, "Ячейка")
  const bodyInstance = program.mount(body, "Текст")
  expect(row.querySelector("td")?.textContent).toBe("Ячейка")
  expect(body.querySelector("td")).toBeNull()
  expect(body.textContent).toBe("Текст")
  rowInstance.update("Обновлено")
  expect(row.querySelector("td")?.textContent).toBe("Обновлено")
  const select = document.createElement("select")
  const options = compile((label: string) => html`<option>${label}</option>`).mount(select, "Выбор")
  expect(select.querySelector("option")?.textContent).toBe("Выбор")
  const textarea = document.createElement("textarea")
  const raw = compile((text: string) => html`${text}`).mount(textarea, "<b>& text")
  expect(textarea.textContent).toBe("<b>& text")
  expect(textarea.querySelector("b")).toBeNull()
  rowInstance.dispose()
  bodyInstance.dispose()
  options.dispose()
  raw.dispose()
})

test("DOM parser lowercases HTML attrs, Template сохраняет case property/custom-event директив", () => {
  const document = createDocument()
  const host = document.createElement("div")
  let events = 0
  const listener = () => { events++ }
  const instance = compile((state: {locked: boolean, tab: number}) => html`<input .readOnly=${state.locked} .tabIndex="${state.tab}" TiTlE="HTML" @myEvent=${listener}>`)
    .mount(host, {locked: true, tab: 0})
  const input = host.querySelector("input")!
  try {
    expect(Reflect.get(input, "readOnly")).toBeTrue()
    expect(Reflect.get(input, "tabIndex")).toBe(0)
    expect(input.getAttribute("title")).toBe("HTML")
    expect(input.hasAttribute(".readonly")).toBeFalse()
    input.dispatchEvent(new Event("myevent"))
    expect(events).toBe(0)
    input.dispatchEvent(new Event("myEvent"))
    expect(events).toBe(1)
    instance.update({locked: false, tab: 2})
    expect(Reflect.get(input, "readOnly")).toBeFalse()
    expect(Reflect.get(input, "tabIndex")).toBe(2)
  } finally { instance.dispose() }
})
