/** pathFieldLayout показывает публичное использование своего владельца. */
import {describe, expect, test} from "bun:test"
import layout from "@immersive-ui-field-layout/path"

describe.each([{name: "Базовый размер", props: {}}])("$name", () => {
  const height = layout.height()
  test("Высота", () => {
    expect(height, "Числовой договор задаёт высоту в CSS px до отрисовки").toBe(28)
  })
})
