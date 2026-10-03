/** Проверяет смысловой результат чтения одного поля метаданных. */
import {describe, expect, test} from "bun:test"
import operation from "@node-metadata/string-array"

describe.each([{name: "Строки", props: {value: {field: ["a", "b"]}, key: "field"}, valid: true}, {name: "Смешанный массив", props: {value: {field: ["a", 1]}, key: "field"}, valid: false}])("$name", ({props, valid}) => {
  const result = operation(props.value, props.key)
  test("Чтение поля", () => {
    expect(result, "Подходящий массив заимствуется целиком, неподходящий не фильтруется частично").toBe(valid ? props.value.field : undefined)
  })
})
