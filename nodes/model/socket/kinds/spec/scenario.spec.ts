/** Проверяет публичные данные и правила операции над сокетами. */
import {describe, expect, test} from "bun:test"
import value from "@immersive-nodes-model-socket/kinds"
import presets from "@immersive-nodes-model-socket/presets"

describe.each([{name: "Каталог видов", props: {keys: Object.keys(presets)}}])("$name", ({props}) => {
  const result: readonly string[] = value
  test("Публичное правило", () => {
    expect([...result], "Каждый вид имеет собственную предустановку").toEqual(props.keys)
    expect(new Set(result).size, "Виды не повторяются").toBe(result.length)
    expect(Object.isFrozen(result), "Набор неизменяем").toBeTrue()
  })
})
