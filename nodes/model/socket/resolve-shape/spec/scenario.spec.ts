/** Проверяет публичные данные и правила операции над сокетами. */
import {describe, expect, test} from "bun:test"
import value from "@zavx0z/immersive-nodes-model-socket-resolve-shape"

describe.each([{name: "Известная форма", props: {value: "line"}, expected: "line"}, {name: "Неизвестная форма", props: {value: "missing"}, expected: undefined}])("$name", ({props, expected}) => {
  const result = value(props.value)
  test("Публичное правило", () => {
    expect(result, "Неизвестная форма оставляет выбор предустановке").toBe(expected)
  })
})
