/** Проверяет публичные данные и правила операции над сокетами. */
import {describe, expect, test} from "bun:test"
import value from "@immersive-nodes-model-socket/metrics"

describe.each([{name: "Геометрия строки", props: {unit: "CSS px"}}])("$name", ({props}) => {
  const result = value
  test("Публичное правило", () => {
    expect(Object.values(result).every(metric => Number.isFinite(metric) && metric > 0), props.unit).toBeTrue()
    expect(result.NODE_ROW_HEIGHT, "Знак сокета помещается в строке").toBeGreaterThan(result.SOCKET_GLYPH_SIZE)
    expect(result.SOCKET_GLYPH_SIZE, "Знак больше собственной границы").toBeGreaterThan(result.NODE_BORDER_WIDTH)
    expect(Object.isFrozen(result), "Измерения не меняются извне").toBeTrue()
  })
})
