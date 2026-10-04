import {expect, test} from "bun:test"
import {createDocument} from "@immersive/dom"
import {createRoot} from "@immersive/component"
import type {CompiledTemplate} from "@immersive/template/compiled"
import type {ParameterSlotFixtureProps} from "./slot-content.fixture.tsx"
import "./compiler.ts"

const {ParameterSlotFixture} = await import("./slot-content.fixture.tsx")

test("ParameterNode отвергает непустой авторский слот вместе с projected Parameters до изменения принятого дерева", () => {
  const document = createDocument()
  const container = document.createElement("div")
  document.append(container)
  const root = createRoot(container)
  const template = ParameterSlotFixture as unknown as CompiledTemplate<ParameterSlotFixtureProps>
  try {
    root.render(template, {authored: false})
    const field = container.querySelector("input")
    expect(field, "пустое назначение слота не конфликтует с projected Parameters").not.toBeNull()

    expect(() => root.render(template, {authored: true})).toThrow(
      "Node slot-conflict accepts either authored slot content or projected Parameters",
    )
    expect(container.querySelector("input"), "отклонённое назначение сохраняет ранее принятое поле").toBe(field)
    expect(container.textContent).not.toContain("Авторское содержимое")
  } finally {
    root.unmount()
  }
})
