/** Проверяет публичные данные и правила операции над сокетами. */
import {describe, expect, test} from "bun:test"
import value from "@socket-values/resolve-kind"

describe.each([{name: "Известный вид", props: {value: "float"}, expected: "float"}, {name: "Неизвестный вид", props: {value: "missing"}, expected: "custom"}])("$name", ({props, expected}) => {
  const result = value(props.value)
  test("Публичное правило", () => {
    expect(result, "Неизвестное значение имеет объявленный fallback").toBe(expected)
  })
})
