/** Проверяет публичные данные и правила операции над сокетами. */
import {describe, expect, test} from "bun:test"
import value from "@socket-values/shapes"
import presets from "@socket-values/presets"

describe.each([{name: "Формы предустановок", props: {presets: Object.values(presets)}}])("$name", ({props}) => {
  const result = value
  test("Публичное правило", () => {
    expect(props.presets.every(preset => result.includes(preset.shape)), "Все формы предустановок поддерживаются").toBeTrue()
    expect(new Set(result).size, "Формы не повторяются").toBe(result.length)
    expect(Object.isFrozen(result), "Набор неизменяем").toBeTrue()
  })
})
