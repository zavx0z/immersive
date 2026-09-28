import {expect, test} from "bun:test"
import {createDocument} from "@zavx0z/dom"
import {createRoot} from "@zavx0z/component"
import {hasSlot} from "@zavx0z/component/slot-presence"
import {composeSlot, type ComposeSlotInput} from "@zavx0z/component/slot"
import {bindConditional, bindText, defineCompiledTemplate, slotContents, writeBinding} from "@zavx0z/template/compiled"

/** Данные настоящего скомпилированного шаблона для проверки текущего render. */
interface PresenceProps {
  [slotContents]?: Readonly<Record<string, ComposeSlotInput["content"]>>
  selected?: string
}

const template = defineCompiledTemplate<PresenceProps>({
  displayName: "SlotPresence",
  slots: ["", "header"],
  bindingCount: 2,
  mount(document) {
    const article = document.createElement("article")
    const result = document.createTextNode("")
    const start = document.createComment("slot:start")
    const end = document.createComment("slot:end")
    article.append(result, start, end)
    return {nodes: [article], bindings: [bindText(result), bindConditional(start, end)]}
  },
  render(props, values) {
    writeBinding(values, 0, JSON.stringify({body: hasSlot(), header: hasSlot(props.selected ?? "header")}))
    writeBinding(values, 1, composeSlot({content: props[slotContents]?.[""]}) ?? composeSlot({content: "fallback"}))
  },
})

test("presence читает nextProps и не принимает fallback за назначенное содержимое", () => {
  const document = createDocument()
  const host = document.createElement("div")
  document.append(host)
  const root = createRoot(host)
  try {
    root.render(template, {})
    const article = host.firstElementChild
    expect(host.textContent).toBe('{"body":false,"header":false}fallback')
    root.render(template, {[slotContents]: {"": [0], header: ["заголовок"]}})
    expect(host.firstElementChild).toBe(article)
    expect(host.textContent).toBe('{"body":true,"header":true}0')
    root.render(template, {[slotContents]: {"": [null, false, "", []], header: []}})
    expect(host.textContent).toBe('{"body":false,"header":false}fallback')
    expect(() => root.render(template, {selected: "missing"})).toThrow('Unknown slot "missing"')
    expect(host.textContent).toBe('{"body":false,"header":false}fallback')
    expect(() => hasSlot()).toThrow("outside component render")
  } finally {
    root.unmount()
  }
})

test("presence вне render и неверное имя отклоняются явно", () => {
  expect(() => hasSlot()).toThrow("outside component render")
  // @ts-expect-error Проверяется JavaScript-граница публичного API.
  expect(() => hasSlot(1)).toThrow("Slot name must be a string")
})
