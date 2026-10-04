/** Проверяет публичные данные и правила операции над сокетами. */
import {describe, expect, test} from "bun:test"
import value from "@immersive-nodes-model-socket/side"

describe.each([{name: "Выход", props: {direction: "output" as const}, expected: "right"}, {name: "Вход", props: {direction: "input" as const}, expected: "left"}, {name: "Явная сторона", props: {direction: "output" as const, side: "left" as const}, expected: "left"}])("$name", ({props, expected}) => {
  const result = value(props)
  test("Публичное правило", () => {
    expect(result, "Явная сторона имеет приоритет над направлением").toBe(expected)
  })
})
