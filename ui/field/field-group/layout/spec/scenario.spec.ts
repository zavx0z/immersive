/** fieldGroupLayout показывает публичное использование своего владельца. */
import {describe, expect, test} from "bun:test"
import layout from "@ui-fields-field-group/layout"

describe.each([{name: "Базовый размер", props: {}}])("$name", () => {
  const height = layout.height()
  test("Высота", () => {
    expect(height, "Числовой договор задаёт высоту в CSS px до отрисовки").toBe(28)
  })
})
