/** Слеш и тильда кодируются без потери границ JSON Pointer. */
import {describe, expect, test} from "bun:test"
import encode from "@nodes/json-pointer-token"

describe.each([
  {name: "Обычное имя", props: {value: "name"}, expected: "name"},
  {name: "Слеш и тильда", props: {value: "a/b~c"}, expected: "a~1b~0c"},
  {name: "Пустой ключ", props: {value: ""}, expected: ""},
])("$name", ({props, expected}) => {
  const result = encode(props.value)
  test("Reference token", () => {
    expect(result, "Кодируется только токен, без ведущего разделителя").toBe(expected)
  })
})
