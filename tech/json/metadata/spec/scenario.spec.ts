/** Участники принимают один источник и имя поля, сохраняя собственные правила результата. */
import {describe, expect, test} from "bun:test"
import {metadata, metadataString, metadataNumber, metadataBoolean, metadataStringArray, metadataObjectArray} from "@nodes/metadata"

describe.each([
  {name: "Нулевое число", props: {value: {field: 0}, key: "field"}, number: 0, boolean: true},
  {name: "False", props: {value: {field: false}, key: "field"}, number: undefined, boolean: false},
])("$name", ({props, number, boolean}) => {
  const result = {
    raw: metadata(props.value, props.key),
    text: metadataString(props.value, props.key, "fallback"),
    number: metadataNumber(props.value, props.key),
    boolean: metadataBoolean(props.value, props.key, true),
    strings: metadataStringArray(props.value, props.key),
    objects: metadataObjectArray(props.value, props.key),
  }
  test("Общий вход и собственный результат", () => {
    expect(result, "Общий источник и ключ сохраняют особенности каждого участника").toEqual({
      raw: props.value.field,
      text: "fallback",
      number,
      boolean,
      strings: undefined,
      objects: undefined,
    })
    expect(Object.keys(props.value), "Читатели не изменяют источник").toEqual(["field"])
  })
})
