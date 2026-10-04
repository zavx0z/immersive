/** Проверяет смысловой результат чтения одного поля метаданных. */
import {describe, expect, test} from "bun:test"
import operation, {type ImmersiveTechJsonMetadataRead} from "@zavx0z/immersive-tech-json-metadata-read"

const variants: readonly {
  name: string
  props: {value: ImmersiveTechJsonMetadataRead.Input[0], key: ImmersiveTechJsonMetadataRead.Input[1]}
  expected: ImmersiveTechJsonMetadataRead.Output
}[] = [
  {name: "Собственное поле", props: {value: {field: 0}, key: "field"}, expected: 0},
  {name: "Не поле JSON", props: {value: {}, key: "constructor"}, expected: undefined},
  {name: "Авторский constructor", props: {value: {constructor: "author"}, key: "constructor"}, expected: "author"},
]

describe.each([...variants])("$name", ({props, expected}) => {
  const result = operation(props.value, props.key)
  test("Чтение поля", () => {
    expect(result, "Читается собственное поле, без prototype-значений").toBe(expected)
  })
})
