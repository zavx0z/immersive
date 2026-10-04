/** Проверяет смысловой результат чтения одного поля метаданных. */
import {describe, expect, test} from "bun:test"
import operation from "@immersive-tech-json-metadata/string"

describe.each([{name: "Строка", props: {value: {field: "text"}, key: "field", fallback: "fallback"}, expected: "text"}, {name: "Пустая строка", props: {value: {field: ""}, key: "field", fallback: "fallback"}, expected: "fallback"}])("$name", ({props, expected}) => {
  const result = operation(props.value, props.key, props.fallback)
  test("Чтение поля", () => {
    expect(result, "Пустая строка использует резервное значение").toBe(expected)
  })
})
