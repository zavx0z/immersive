/** matrixFieldLayout показывает публичное использование своего владельца. */
import {describe, expect, test} from "bun:test"
import layout from "@immersive-ui-field-layout/matrix"

describe.each([{name: "Базовый размер", props: {}}])("$name", () => {
  const height = layout.height({size: 2})
  test("Высота", () => {
    expect(height, "Числовой договор задаёт высоту в CSS px до отрисовки").toBe(58)
  })
})
