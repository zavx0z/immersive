/** Проверяет смысловой результат чтения одного поля метаданных. */
import {describe, expect, test} from "bun:test"
import operation from "@node-metadata/read"

describe.each([{name: "Собственное поле", props: {value: {field: 0}, key: "field"}, expected: 0}, {name: "Не поле JSON", props: {value: {}, key: "constructor"}, expected: undefined}, {name: "Авторский constructor", props: {value: {constructor: "author"}, key: "constructor"}, expected: "author"}])("$name", ({props, expected}) => {
  const result = operation(props.value, props.key)
  test("Чтение поля", () => {
    expect(result, "Читается собственное поле, без prototype-значений").toBe(expected)
  })
})
