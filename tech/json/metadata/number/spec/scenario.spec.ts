/** Проверяет смысловой результат чтения одного поля метаданных. */
import {describe, expect, test} from "bun:test"
import operation from "@node-metadata/number"

describe.each([{name: "Ноль", props: {value: {field: 0}, key: "field"}, expected: 0}, {name: "Не число", props: {value: {field: "0"}, key: "field"}, expected: undefined}])("$name", ({props, expected}) => {
  const result = operation(props.value, props.key)
  test("Чтение поля", () => {
    expect(result, "Числа не преобразуются из строк, ноль сохраняется").toBe(expected)
  })
})
