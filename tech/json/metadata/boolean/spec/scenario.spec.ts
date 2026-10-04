/** Проверяет смысловой результат чтения одного поля метаданных. */
import {describe, expect, test} from "bun:test"
import operation from "@zavx0z/immersive-tech-json-metadata-boolean"

describe.each([{name: "False", props: {value: {field: false}, key: "field", fallback: true}, expected: false}, {name: "Не boolean", props: {value: {field: 0}, key: "field", fallback: true}, expected: true}])("$name", ({props, expected}) => {
  const result = operation(props.value, props.key, props.fallback)
  test("Чтение поля", () => {
    expect(result, "False не смешивается с отсутствующим значением").toBe(expected)
  })
})
