/** Проверяет смысловой результат чтения одного поля метаданных. */
import {describe, expect, test} from "bun:test"
import operation from "@zavx0z/immersive-tech-json-metadata-object-array"

describe.each([{name: "Объекты", props: {value: {field: [{id: "a"}]}, key: "field"}, valid: true}, {name: "Смешанный массив", props: {value: {field: [{id: "a"}, null]}, key: "field"}, valid: false}])("$name", ({props, valid}) => {
  const result = operation(props.value, props.key)
  test("Чтение поля", () => {
    expect(result, "Подходящие записи сохраняют identity исходного массива").toBe(valid ? props.value.field : undefined)
  })
})
