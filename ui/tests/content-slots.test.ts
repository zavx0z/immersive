import {describe, expect, test} from "bun:test"
import {resolve} from "node:path"
import {createRoot} from "@zavx0z/component"
import {createDocument, MouseEvent} from "@zavx0z/dom"
import createJsxBunPlugin from "@jsx-compiler/bun"
import type {CompiledTemplate} from "@zavx0z/template/compiled"
import type {PaneTextContent} from "@ui-surfaces/pane"
import type {TabProps} from "@ui-surfaces/tab"

const workspace = resolve(import.meta.dir, "../..")
Bun.plugin(createJsxBunPlugin({
  cwd: workspace,
  persistent: true,
  sourceRoots: [resolve(workspace, "ui")],
}))
const {
  FieldGroupSlotFixture,
  PaneSlotFixture,
  StatusBarSlotFixture,
  SurfaceSlotFixture,
  TabSlotFixture,
} = await import("./content-slots.fixture.tsx")
const {TabChildrenFixture} = await import("./tab.fixture.tsx")

/** Semantic host проверяет настоящий скомпилированный UI без второго renderer или browser. */
function mount() {
  const document = createDocument()
  const container = document.createElement("main")
  document.append(container)
  return {container, root: createRoot(container)}
}

describe("UI композиция через slot", () => {
  test("Pane сохраняет primitive fallback и переключается на вложенный компонент", () => {
    const {container, root} = mount()
    const template = PaneSlotFixture as unknown as CompiledTemplate<{supplied: boolean; content?: PaneTextContent}>
    try {
      root.render(template, {supplied: false, content: 0})
      const fallback = container.textContent
      const owner = container.firstElementChild
      root.render(template, {supplied: true})
      expect({fallback, content: container.textContent, same: container.firstElementChild === owner}).toEqual({
        fallback: "0",
        content: "Вложенное",
        same: true,
      })
    } finally {
      root.unmount()
    }
  })

  test("Pane отклоняет одновременные primitive content и вложенное содержимое", () => {
    const {root} = mount()
    try {
      expect(() => root.render(
        PaneSlotFixture as unknown as CompiledTemplate<{supplied: boolean; content?: PaneTextContent}>,
        {supplied: true, content: "Конфликт"},
      )).toThrow("either slot content or primitive content")
    } finally {
      root.unmount()
    }
  })

  test("FieldGroup отклоняет пустую условную позицию", () => {
    const {root} = mount()
    try {
      expect(() => root.render(
        FieldGroupSlotFixture as unknown as CompiledTemplate<{supplied: boolean}>,
        {supplied: false},
      )).toThrow("non-empty slot content")
    } finally {
      root.unmount()
    }
  })

  test("FieldGroup принимает непустой slot", () => {
    const {container, root} = mount()
    try {
      root.render(FieldGroupSlotFixture as unknown as CompiledTemplate<{supplied: boolean}>, {supplied: true})
      expect(container.querySelector("[data-field-group]")?.textContent).toBe("Поле")
    } finally {
      root.unmount()
    }
  })

  test("Tab требует подпись либо непустой slot", () => {
    const {root} = mount()
    try {
      expect(() => root.render(
        TabSlotFixture as unknown as CompiledTemplate<{supplied: boolean; label?: string}>,
        {supplied: false},
      )).toThrow("label or slot content")
    } finally {
      root.unmount()
    }
  })

  test("Tab принимает вложенную кнопку без label", () => {
    const {container, root} = mount()
    try {
      root.render(TabSlotFixture as unknown as CompiledTemplate<{supplied: boolean; label?: string}>, {supplied: true})
      expect(container.querySelector("[data-tab] button")?.textContent).toBe("Вложенная кнопка")
    } finally {
      root.unmount()
    }
  })

  test("вложенная кнопка Tab сохраняет клик, DOM и состояние после смены стороны", () => {
    const {container, root} = mount()
    const template = TabChildrenFixture as unknown as CompiledTemplate<Pick<TabProps, "position">>
    try {
      root.render(template, {position: {edge: "top", offset: .5}})
      const button = container.querySelector("button")!
      button.dispatchEvent(new MouseEvent("click", {bubbles: true}))
      root.flush()
      root.render(template, {position: {edge: "left", offset: .5}})
      root.flush()
      expect({same: container.querySelector("button") === button, text: button.textContent}).toEqual({
        same: true,
        text: "Нажатий: 1",
      })
    } finally {
      root.unmount()
    }
  })

  test("StatusBar сохраняет приоритет custom content и возвращает стартовую строку при опустошении", () => {
    const {container, root} = mount()
    const template = StatusBarSlotFixture as unknown as CompiledTemplate<{supplied: boolean}>
    try {
      root.render(template, {supplied: true})
      const start = container.querySelector('[data-alignment="start"]')!
      const custom = container.querySelector("[data-status-content]")!
      const supplied = {start: start.hasAttribute("hidden"), custom: custom.hasAttribute("hidden")}
      root.render(template, {supplied: false})
      expect({
        supplied,
        empty: {start: start.hasAttribute("hidden"), custom: custom.hasAttribute("hidden")},
        end: container.querySelector('[data-alignment="end"]')?.textContent,
      }).toEqual({supplied: {start: true, custom: false}, empty: {start: false, custom: true}, end: " | Конец"})
    } finally {
      root.unmount()
    }
  })

  test("Window и Frame передают один компонент дальше через Panel и Pane", () => {
    const {container, root} = mount()
    try {
      root.render(SurfaceSlotFixture as unknown as CompiledTemplate<Record<string, never>>, {})
      expect([...container.querySelectorAll("button")].filter(button => button.textContent === "Сквозной контент")).toHaveLength(1)
    } finally {
      root.unmount()
    }
  })
})
